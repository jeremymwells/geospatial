var DrawingManager = require('./drawingManager.object.js'),
    cfg = require('../../package.json').config,
    moment = require('moment'),
    util = require('util'),
    _ = require('lodash');

/**
 * An object that extends/wraps the google maps Map
 * @constructor
 */
function Map(mapCfg){

    this.config = mapCfg;

	this.gMap = new google.maps.Map(mapCfg.element[0], mapCfg.config);

	this.drawingManager = new DrawingManager(this);

	this.initializeEventListeners();

	return this;
}

/**
 * Initializes event listeners for Map.gMap, which is the google maps api map object.
 * @returns {void}
 */
Map.prototype.initializeEventListeners = function(){
	var self = this;

    self[self.events.MAP_BOUNDS_CHANGED] = angular.noop;
    self[self.events.ZOOM] = angular.noop;

    //expose events
	google.maps.event.addListener(this.gMap, this.events.MAP_BOUNDS_CHANGED, function(o){
        self[self.events.MAP_BOUNDS_CHANGED](self.drawingManager.getCurrentGeometry(), o); 
	});

	google.maps.event.addListener(this.gMap, this.events.ZOOM, function(o){
        self[self.events.ZOOM](self.gMap.getZoom(), o); 
	});
}

Map.prototype.getCenterPoint = function(){
    return { lat: this.gMap.getCenter().lat(), lon:this.gMap.getCenter().lng() }
}

Map.prototype.drawPolygon = function(polygon){
    var poly = { paths:polygon, map: this.gMap };
    console.log('drawing polygon!!');
    var bermudaTriangle = new google.maps.Polygon(_.assign(poly, cfg.polygonStyle));
}

/**
 * Exposes the ability to attach functions to events externally 
 * @param {string} eventName - The name of the event 
 * @param {function} fn - The function to call when the event fires
 * @returns {void}
 */
Map.prototype.on = function(eventName, fn){
    this[eventName] = fn;
}

/**
 * Establishes icons for map markers
 */
Map.prototype.icons = {
    GROUP_CIRCLE:{
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: 'lightblue',
        fillOpacity: .7,
        scale: 10,
        strokeColor: 'black',
        strokeWeight: 1
    },
    PICKUP_ARROW:{        
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        fillColor: 'green',
        fillOpacity: .7,
        scale: 4.5,
        strokeColor: 'white',
        strokeWeight: 1
    },
    DROPOFF_ARROW:{
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: 'red',
        fillOpacity: .7,
        scale: 4.5,
        strokeColor: 'white',
        strokeWeight: 1
    }
};

/**
 * Establishes events for Map
 */
Map.prototype.events = {
    MAP_BOUNDS_CHANGED:'bounds_changed',
    ZOOM: 'zoom_changed',
    SET_POLYGON: 'overlaycomplete',
    CLEAR_POLYGON: 'keyup'
}

module.exports = Map;


