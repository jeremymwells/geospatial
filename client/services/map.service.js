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
var mapService = function($window, $q, solrSvc, toolsSvc, $state, $timeout, markerSvc){

    var self = this;
    this.loading = false;
    this.markers = [];

    function showClusters(data){

        return new $q(function(resolve, reject){

            clearMarkers();

            for(var i =0;i<data.length;i++){
                self.markers.push(markerSvc.getMarker(data[i], self.map.gMap));
            }

            self.markerClusterer = markerSvc.getClusterer(self.map.gMap, self.markers)

            resolve(self.markers);
        })
    }

    /**
     * Sets mapSvc.heatmapPoints
     * @param {[]} points - The groups of GeoPoints used to set heatmapPoints
     * @returns {void}
     */
    function showHeatmap(points){
        return new $q(function(resolve, reject){
            clearMarkers();
            self.markers = markerSvc.getHeatmapData(points);
            self.map.gMapHeatMap = new google.maps.visualization.HeatmapLayer({
                data: self.markers,
                map: self.map.gMap
            });
            self.map.gMapHeatMap.set('radius', 30);
            resolve(self.markers);
        });
    }

    function clearMarkers(){
        
        if (self.map.gMapHeatMap){ self.map.gMapHeatMap.data.clear(); }
        
        if (self.markerClusterer){ self.markerClusterer.clearMarkers(); }

        (self.markers || []).forEach(function(marker){ if (marker.setMap) { marker.setMap(null); } });

        self.markers = [];
    }

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
            .then($state.params.heatmap === 'true' ? showHeatmap : showClusters)
            .then(function(){
                self.loading = false;
            }).catch(function(err){
                console.log('ERROR!!!!', err, err.stack)
            });
    }

    this.getCurrentCenter = function(){
        if ($state.params.mapCenter) { return $state.params.mapCenter.toPoint(); }
        if (self.map) { return new Point(self.map.getCenterPoint()); }
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
                    startDate: $state.params.startDate || moment('04012014', 'MMDDYYYY').toISOString(),
                    endDate: $state.params.endDate || moment('04302014', 'MMDDYYYY').toISOString(),
                    mapCenter: $state.params.mapCenter || point.toWKTPointString(),
                    heatmap: $state.params.heatmap || false
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


