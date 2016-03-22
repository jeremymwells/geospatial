var _ = require('lodash'),
	moment = require('moment'),
	util = require('util');

function markerClustererSvc(){
	var self = this;
	this.mcOptions = {
		styles: [{
			url: '/images/green.png'
		},{
			url: '/images/red.png'
		},{
			url: '/images/blue.png'
		}]
	};

	this.getTitle = function(pickups, dropoffs){
		var pickupDesc = 'pickup',
        dropoffDesc = 'dropoff';

        if (pickups > 1){ pickupDesc += 's'; }
        if (dropoffs > 1){ dropoffDesc += 's'; }

        return util.format('%s %s | %s %s', pickups, pickupDesc, dropoffs, dropoffDesc)
	}

	this.getContentNode = function(url, label, title){
		var img = document.createElement('img');
		img.setAttribute('src', url);

		var label = document.createElement('div');
		label.innerHTML = label;

		var container = document.createElement('div');
		container.setAttribute('class', 'cluster');
		container.setAttribute('title', title);
		container.appendChild(img);
		container.appendChild(label);

		return container;
	}

    this.getMarker = function(cluster, map){
    	var pickupsCount = _.result(cluster, 'pickups.count', 0),
    		dropoffsCount = _.result(cluster, 'dropoffs.count', 0),
    		icon, 
    		label,
    		title;

    	//pickups -->
    	if (pickupsCount && !dropoffsCount){
    		icon = self.mcOptions.styles[0];
    		label = ''+pickupsCount;
    		title = label + ' pickup @ ' + moment(cluster.pickups.date).format('MM/DD/YYYY');
    	}

    	//dropoffs -->
    	if (!pickupsCount && dropoffsCount){
    		icon = self.mcOptions.styles[1];
    		label = ''+dropoffsCount;
    		title = label + ' dropoff @ ' + moment(cluster.dropoffs.date).format('MM/DD/YYYY');
    	}

    	//both pickups and dropoffs -->
    	if (pickupsCount>0 && dropoffsCount > 0) {
    		icon = self.mcOptions.styles[2];
    		label = ''+cluster.totalPointsRepresented;
    		title = self.getTitle(pickupsCount, dropoffsCount)
    	}

  //   	var markerCfg = _.extend({'position': }, cluster);
  //   	markerCfg.position = cluster;
		// markerCfg.map = map;
  //      	markerCfg.labelContent = 
  //   	markerCfg.icon = icon;
		// markerCfg.title = title;
		return new MarkerWithLabel({
			icon:icon,
			position: new google.maps.LatLng(cluster.lat, cluster.lng),
			labelContent: label, //self.getContentNode(icon.url, label, title),
			labelClass: 'labels',
			title:title,
			labelAnchor: new google.maps.Point(0, 0),
       		draggable: false,
       		raiseOnDrag: false,
       		map: map
		});
        // return new google.maps.Marker(markerCfg);
    }

	this.getLabeledClusters = function(data, gMap){
		self.clusters = data.map(function(curCluster){
			console.log(curCluster);
			return self.getMarker(curCluster, gMap)
		});

		return self.clusters;


        // var markerClusterer = new MarkerClusterer(gMap, self.markers);
        // markerClusterer.setCalculator(self.calculate);

        // return self.markers;
	}

}

module.exports = markerClustererSvc;