var _ = require('lodash'),
	moment = require('moment'),
	util = require('util');

function markerSvc(){
	var self = this;
	this.mcOptions = {
		styles: [{
			index:1,
			width:55,
			height:55,
			url: '/images/green.png'
		},{
			index:2,
			width:55,
			height:55,
			url: '/images/red.png'
		},{
			index:3,
			width:55,
			height:55,
			url: '/images/blue.png'
		}],
		zoomOnClick:false,
		maxZoom:20
	};

	function getMarkerFacets(cluster){
		var pickupsCount = _.result(cluster, 'pickups.count', 0),
            dropoffsCount = _.result(cluster, 'dropoffs.count', 0),
            pickupDesc = pickupsCount === 1 ? 'pickup' : 'pickups',
        	dropoffDesc = dropoffsCount === 1 ? 'dropoff' : 'dropoffs',
        	pickupTime = pickupsCount === 1 ? ' on ' + moment(cluster.pickups.date).format('MM/DD/YYYY') : '',
        	dropoffTime = dropoffsCount === 1 ? ' on ' + moment(cluster.dropoffs.date).format('MM/DD/YYYY') : '';

		cluster.pickups = cluster.pickups || { count:0, date:'' };
		cluster.dropoffs = cluster.dropoffs || { count:0, date:'' };		

        //pickups -->
        if (pickupsCount && !dropoffsCount){
            icon = self.mcOptions.styles[0]; // '/images/green.png';
            total = pickupsCount;
            label = ''+total;
            title = util.format('%s %s%s\n[%s, %s]', label, pickupDesc, pickupTime, cluster.lat, cluster.lon)
        }

        //dropoffs -->
        if (!pickupsCount && dropoffsCount){
            icon = self.mcOptions.styles[1]; // '/images/red.png';
            total = dropoffsCount;
            label = ''+total;
            title = util.format('%s %s%s\n[%s, %s]', label, dropoffDesc, dropoffTime, cluster.lat, cluster.lon)
        }

        //both pickups and dropoffs -->
        if (pickupsCount>0 && dropoffsCount > 0) {
            icon = self.mcOptions.styles[2]; // '/images/blue.png';
            total = cluster.totalPointsRepresented;
            label = ''+total;
            title = util.format('%s %s | %s %s\n[%s, %s]', pickupsCount, pickupDesc, dropoffsCount, dropoffDesc, cluster.lat, cluster.lon)
        }

        return {
        	pickups:cluster.pickups,
        	dropoffs:cluster.dropoffs,
        	icon:icon,
        	label:label,
        	total:total,
        	title:title
        }
	}

    this.getHeatmapData = function(clusters){
        return clusters.map(function(cluster){
            return {
                location: new google.maps.LatLng(cluster.lat, cluster.lon),
                weight  : cluster.totalPointsRepresented
            }
        });
    }

    this.getMarker = function(cluster, map){

        var facets = getMarkerFacets(cluster);

        return new MarkerWithLabel({
        	facets:facets,
            icon: facets.icon.url,
            position: new google.maps.LatLng(cluster.lat, cluster.lng),
            labelContent: label,
            labelClass: 'labels',
            title: facets.title,
            labelAnchor: new google.maps.Point(30,32),
            draggable: false,
            raiseOnDrag: false,
            map: map,
            maxZoom:20
        });
    }

    this.calculator = function(markers, numStyles) {
    	var total = 0,
    		pickupsCount = 0,
    		dropoffsCount = 0,
    		pickupDate,
    		dropoffDate,
    		title,
    		icon,
    		lat,
    		lon;

		for(var i =0;i<markers.length;i++){
			total += markers[i].facets.total;
			pickupsCount += markers[i].facets.pickups.count;
			dropoffsCount += markers[i].facets.dropoffs.count;
			pickupDate = pickupDate || markers[i].facets.pickups.date;
			dropoffDate = dropoffDate || markers[i].facets.dropoffs.date;
			lat = markers[i].position.lat().toFixed(6);
			lon = markers[i].position.lng().toFixed(6);
		}

		var pickupDesc = pickupsCount === 1 ? 'pickup' : 'pickups',
        	dropoffDesc = dropoffsCount === 1 ? 'dropoff' : 'dropoffs',
        	pickupTime = pickupsCount === 1 ? ' on ' + moment(pickupDate).format('MM/DD/YYYY') : '',
        	dropoffTime = dropoffsCount === 1 ? ' on ' + moment(pickupDate).format('MM/DD/YYYY') : '';

		//pickups -->
        if (pickupsCount && !dropoffsCount){
            icon = self.mcOptions.styles[0];
            title = util.format('%s %s%s\n[%s, %s]', pickupsCount, pickupDesc, pickupTime, lat, lon)
        }

        //dropoffs -->
        if (!pickupsCount && dropoffsCount){
            icon = self.mcOptions.styles[1]; 
            title = util.format('%s %s%s\n[%s, %s]', dropoffsCount, dropoffDesc, dropoffTime, lat, lon)
        }

        //both pickups and dropoffs -->
        if (pickupsCount > 0 && dropoffsCount > 0) {
            icon = self.mcOptions.styles[2];
            title = util.format('%s %s | %s %s\n[%s, %s]', pickupsCount, pickupDesc, dropoffsCount, dropoffDesc, lat, lon)
        }

		return {
			text: '<strong>'+total+'</strong>',
			title: title,
			index: icon.index
		};
	}

    this.getClusterer = function(map, markers){
    	var clusterer = new MarkerClusterer(map, markers, self.mcOptions);
    	clusterer.setCalculator(self.calculator);
    	return clusterer;
    }


}

module.exports = markerSvc;