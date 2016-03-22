'use strict';

var Map = require('../objects/map.object'),
    Point = require('../objects/point.object'),
    util = require('util'),
    moment = require('moment'),
    _ = require('lodash'),
    geohash = require('geo-hash');

 /**
 * Represents a map service
 * @constructor
 */
var mapService = function($window, $q, solrSvc, toolsSvc, $state, $timeout, markerLabelerSvc){

    var self = this;
    this.heatMap = false;
    this.loading = false;
    this.markers = [];
    this.heatmapPoints = [];

    /**
     * Callback function
     * Called by various events when geometry changes
     * Updates map
     * @param {[[]]} currentGeometry - The array of arrays, comprising a polygon
     * @returns {void}
     */
    function updatePolygon(currentGeometry){
        _.assign($state.params,{ mapCenter: new Point(self.map.getCenterPoint()).toWKTPointString(), polygon: currentGeometry.toWKTPolygonString() })
        self.updateMap();
    }

    /**
     * Callback function
     * Called when zoom changes
     * Updates map
     * @param {number} zoom - The new zoom 
     * @returns {void}
     */
    function updateZoom(zoom){
        _.assign($state.params,{  mapCenter: $state.params.mapCenter, zoom:zoom })
        self.updateMap();
    }



    function debounceSolrSvcRequest(){        
        if (self.currentRequest) { $timeout.cancel(self.currentRequest); }
        return $q(function(resolve){
            self.currentRequest = $timeout(function(){
                resolve(solrSvc.getSolrPointsFromStateQuery($state.params)); 
            }, 500);
        });
    }

    this.updateMap = function(){        
        self.loading = true;
        $state.go($state.current, $state.params)
            .then(debounceSolrSvcRequest)
            .then(self.handlePoints)
            .then(function(){
                self.loading = false;
            });
    }

    this.getCurrentCenter = function(){
        if ($state.params.mapCenter) { return $state.params.mapCenter.toPoint(); }
        if (self.map) { return new Point(self.map.getCenterPoint()); }
    }

    /**
     * Toggles map between heatmap mode and regular mode
     * @returns {void}
     */
    this.toggleMap = function(){
        self.heatMap = !self.heatMap;
        self.loading = true;
    }

    /**
     * Handles points sent by server depending on map mode (heatmap or normal)
     * @param {[]} points - The groups of GeoPoints
     * @returns {void}
     */
    this.handlePoints = function(points){
        if (self.heatMap){
            self.setHeatPoints(points);
            self.gMapHeatMap = new google.maps.visualization.HeatmapLayer({
                data: self.heatmapPoints,
                map: self.map.gMap
            });
        }else{
            self.setMarkers(points);
        }
    }

    /**
     * Sets mapSvc.heatmapPoints
     * @param {[]} points - The groups of GeoPoints used to set heatmapPoints
     * @returns {void}
     */
    this.setHeatPoints = function(points){
        self.clearMarkers();
        for(var i =0;i<points.length;i++){
            var pt = points[i];
            var pickupLatLng = new google.maps.LatLng(parseFloat(pt.Pickup.x),parseFloat(pt.Pickup.y));            
            self.heatmapPoints.push(pickupLatLng);
            if (pt.count===1){                
                self.heatmapPoints.push(new google.maps.LatLng(parseFloat(pt.Dropoff.x),parseFloat(pt.Dropoff.y)));
            }
        }
    }

    /**
     * Clears heatmap points from map
     * @returns {void}
     */
    this.clearHeatPoints = function(){
        if (self.gMapHeatMap){
            self.gMapHeatMap.setMap(null);
        }
    }

    /**
     * Clears heatmap points and markers from map
     * @returns {void}
     */
    this.clearMarkers = function(){
        self.clearHeatPoints();

        if (self.markerClusterer){
            self.markerClusterer.clearMarkers();
        }

        if (self.markers) {
            for(var i =0;i<self.markers.length;i++){
                self.markers[i].setMap(null);
            }
        }
        self.markers = [];
    }

    this.getTitle = function(pickups, dropoffs){
        var pickupDesc = 'pickup',
        dropoffDesc = 'dropoff';

        if (pickups > 1){ pickupDesc += 's'; }
        if (dropoffs > 1){ dropoffDesc += 's'; }


        return util.format('%s %s | %s %s', pickups, pickupDesc, dropoffs, dropoffDesc)
    }

    this.getMarker = function(cluster){
        var pickupsCount = _.result(cluster, 'pickups.count', 0),
            dropoffsCount = _.result(cluster, 'dropoffs.count', 0),
            icon, 
            label,
            title;

        //pickups -->
        if (pickupsCount && !dropoffsCount){
            icon = '/images/green.png';
            label = ''+pickupsCount;
            title = label + ' pickup @ ' + moment(cluster.pickups.date).format('MM/DD/YYYY');
        }

        //dropoffs -->
        if (!pickupsCount && dropoffsCount){
            icon = '/images/red.png';
            label = ''+dropoffsCount;
            title = label + ' dropoff @ ' + moment(cluster.dropoffs.date).format('MM/DD/YYYY');
        }

        //both pickups and dropoffs -->
        if (pickupsCount>0 && dropoffsCount > 0) {
            icon = '/images/blue.png';
            label = ''+cluster.totalPointsRepresented;
            title = self.getTitle(pickupsCount, dropoffsCount)
        }

        return new MarkerWithLabel({
            icon:icon,
            position: new google.maps.LatLng(cluster.lat, cluster.lng),
            labelContent: label, //self.getContentNode(icon.url, label, title),
            labelClass: 'labels',
            title:title,
            labelAnchor: new google.maps.Point(30,35),
            draggable: false,
            raiseOnDrag: false,
            map: self.map.gMap
        });
        // return new google.maps.Marker(markerCfg);
    }
    /**
     * Sets mapSvc.markers
     * @param {[]} points - The groups of GeoPoints used to set markers
     * @returns {Promise<void>}
     */
    this.setMarkers = function(data){

        return new $q(function(resolve, reject){

            self.clearMarkers();

            self.markers = [];
            for(var i =0;i<data.length;i++){
                self.markers.push(self.getMarker(data[i]));
            }

        })
    }

    this.getInitialCenterPoint = function(){
        var deferred = $q.defer(); 
        if ($state.params.mapCenter || self.map) { deferred.resolve(self.getCurrentCenter()); }
        solrSvc.getInitialPoint().then(function(point){ deferred.resolve(new Point(point)); });
        return deferred.promise;
    }

    /**
     * Initializes the map
     * @param {object} scope - The angular scope to be used
     * @param {object} element - The angular element to append the map to
     * @param {object} firstPoint - The first point to set the map with
     * @returns {Map}
     */
    this.initializeMap = function(scope, element){

        var point = $state.params.mapCenter.toPoint()
        self.map = new Map({
            config: {
                center: { lat: point.lat, lng: point.lon }, 
                zoom: parseInt($state.params.zoom)
            },
            state: $state,
            scope: scope, 
            element: element
        });

        //must decide if drawing polygon before setting polygon to map bounds
        //must do this before polygon gets set anywhere.
        // console.log(self.map.drawingManager.geometryIsMapBounds());
        if (!self.map.drawingManager.geometryIsMapBounds()){
            self.map.drawPolygon($state.params.polygon);
        }

        return $q(function(resolve){ resolve(self.map); });

    }

    this.initializeMapTools = function(map){
        return toolsSvc.compile(map);        
    }

    this.initializeRouteDefaults = function(){

        return self.getInitialCenterPoint().then(function(point){
            return $q(function(resolve){ 
                resolve(_.extend($state.params, {
                    pickups: $state.params.pickups || true,
                    dropoffs: $state.params.dropoffs || true,
                    zoom: $state.params.zoom || 14,
                    startDate: $state.params.startDate || moment().add(-4, 'y').toISOString(),
                    endDate: $state.params.endDate || moment().add(1, 'd').toISOString(),
                    mapCenter: $state.params.mapCenter || point.toWKTPointString()
                }))
            });
        })
        
        
    }

    this.bootstrap = function(scope, element){

        self.initializeRouteDefaults()
            .then(function(){
                return self.initializeMap(scope, element);
            })
            .then(self.initializeMapTools)
            .then(function(map){

                map.on(map.events.ZOOM, updateZoom);

                map.on(map.events.MAP_BOUNDS_CHANGED, updatePolygon);        

                map.on(map.events.SET_POLYGON, updatePolygon);

                map.on(map.events.CLEAR_POLYGON, updatePolygon);

                return self.updateMap();
            });
    }

}

module.exports = mapService;


