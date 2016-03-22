

/**
 * An object that extends/wraps the google maps' DrawingManager
 * @constructor
 */
function DrawingManager(map){

	this.gMapDrawingManager = new google.maps.drawing.DrawingManager({
		map: map.gMap,
		drawingMode: google.maps.drawing.OverlayType.MARKER,
		drawingControl: true,
		drawingControlOptions: {
		  position: google.maps.ControlPosition.TOP_CENTER,
		  drawingModes: [
		  	google.maps.drawing.OverlayType.POLYGON
		  ]
		},
		polygonOptions:{
			strokeColor:'gray',
			strokeWeight:1,
			fillColor:'lightblue',
			opacity:.7
		}
	});

	//default draw mode = null-->
	this.gMapDrawingManager.setDrawingMode(null);

	this.map = map;
	
	this.initializeEventListeners();

	return this;
}

/**
 * Initializes event listeners for Map.gMapDrawingManager, which is the google maps api map object.
 * @returns {void}
 */
DrawingManager.prototype.initializeEventListeners = function(){

	var self = this;
	self.map[self.map.events.SET_POLYGON] = angular.noop;
	self.map[this.map.events.CLEAR_POLYGON] = angular.noop;

	google.maps.event.addListener(this.gMapDrawingManager, this.map.events.SET_POLYGON, function(o){
		self.unsetPolygonOverlay();
		self.gMapDrawingOverlay = o.overlay;
		self.map[self.map.events.SET_POLYGON](self.getCurrentGeometry(), o);	
	});

	//escape key kills polygon select-->
	google.maps.event.addDomListener(document, this.map.events.CLEAR_POLYGON, function (e) {        
	    var code = (e.keyCode ? e.keyCode : e.which);        
	    if (code === 27) {
	        self.unsetPolygonOverlay(e);	        
	    }
	});

}

/**
 * Removes the polygon overlay from the gMap
 * Raises a CLEAR_POLYGON event
 * @param {object} o - The gMap object
 * @returns {void}
 */
DrawingManager.prototype.unsetPolygonOverlay = function(o){
	this.gMapDrawingManager.setDrawingMode(null);
	if (this.gMapDrawingOverlay){
		this.gMapDrawingOverlay.setMap(null);
		this.gMapDrawingOverlay = undefined;
	}

	this.map[this.map.events.CLEAR_POLYGON](this.getCurrentGeometry(), o);  
}

/**
 * Returns either the polygon overlay from the gMap or the map bounds
 * Raises a CLEAR_POLYGON event
 * @returns {[[]]} Geometry
 */
DrawingManager.prototype.getCurrentGeometry = function(){
	if (!this.gMapDrawingOverlay) {
		this.currentGeometry = this.getMapBoundsGeometry();		
	}else{
		this.currentGeometry = this.getOverlayGeometry();
	}
	return this.currentGeometry;
}

DrawingManager.prototype.geometryIsMapBounds = function(){
	if (!this.gMap){ return true; }

	var curGeom = this.getMapBoundsGeometry();
	console.log(curGeom);
	return this.currentGeometry[0] === curGeom[0] &&
		this.currentGeometry[1] === curGeom[1];
}

/**
 * Returns gMap bounds Geometry
 * @returns {[[]]} Geometry
 */
DrawingManager.prototype.getMapBoundsGeometry = function(){
	var bounds = this.map.gMap.getBounds();
	var ne = bounds.getNorthEast();
	var sw = bounds.getSouthWest();

	return [
		[ne.lat(),ne.lng()],
		[sw.lat(),ne.lng()],
		[sw.lat(),sw.lng()],
		[ne.lat(),sw.lng()],
		[ne.lat(),ne.lng()]
	];
}

/**
 * Returns gMap polygon overlay Geometry
 * @returns {[[]]} Geometry
 */
DrawingManager.prototype.getOverlayGeometry = function(){
	var geometry = [];
	var paths = this.gMapDrawingOverlay.getPaths();
	for(var i =0;i<paths.length;i++){
    	var vertices = paths.getAt(i);
    	for(var j=0;j<vertices.length;j++){	    		
    		var vertice = vertices.getAt(j);
    		geometry.push([vertice.lat(), vertice.lng()])
    	}    	
    }
    //close polygon-->
    geometry.push(geometry[0]);
    return geometry;
}


module.exports = DrawingManager;