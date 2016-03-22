var util = require('util'),
	db = require('./db'),
	sql = require('./sql');

/**
 * Builds a polygon 
 * @param {array} arrays - The arrays to build the polygon from
 * @returns {Polygon}
 */
var buildPolygon = function(arrays){
	var polygon = 'PolygonFromText(\'POLYGON((';
	for(var i=0;i<arrays.length;i++){
		polygon += util.format('%d %d %s', 
			arrays[i][0], 
			arrays[i][1], 
			i===arrays.length-1 ? '' : ','
		);
	}
	polygon += '))\')';

	return polygon;
}

/**
 * Turns a map zoom into a number to be used for truncating lat/lng
 * @param {number} zoom - The zoom level that will be used
 * @returns {number}
 */
var zoomToLatLonTrunc = function(zoom){
	//lat lon distances per decimal place
	//http://gis.stackexchange.com/questions/8650/how-to-measure-the-accuracy-of-latitude-and-longitude#answer-8674
	var max = 6;
	if (zoom > 17){
		return max;
	}
	if (zoom > 14){
		return 3
	}
	if (zoom > 10){
		return 2;
	}
	return 1;
}

/**
 * Builds the query that is used to populate the map
 * @param {object} query - The object containing what will go into the sql query
 * @returns {string}
 */
var buildQuery = function(query){
	return util.format(sql.pickupClusteredQuery,
		buildPolygon(query.polygon),
		zoomToLatLonTrunc(query.zoom), 
		zoomToLatLonTrunc(query.zoom),
		query.startDate, 
		query.endDate,
		query.startDate, 
		query.endDate
	);
}

/**
 * Runs a database query
 * @param {string} query - The sql query
 * @returns {Promise<databaseResult>}
 */
var runQuery = function(query){
	return db.getReadResult(query); 
}

/**
 * Runs turns the query object into sql and runs it agains the db
 * @param {object} query - The object containing what will go into the sql query
 * @returns {Promise<databaseResult>}
 */
var runMapQuery = function(query){
	return db.getReadResult(buildQuery(query)).then(function(results){ return results[1]; });
}

/**
 * Gets the first point from the GeoPoints table
 * @returns {Promise<databaseResult>}
 */
var getFirstPoint = function(){
	return db.getReadResult('SELECT Pickup from GeoPoints limit 1');
}

module.exports = {
	getFirstPoint : getFirstPoint,
	runQuery:runQuery,
	runMapQuery:runMapQuery,
	sql:sql
}
