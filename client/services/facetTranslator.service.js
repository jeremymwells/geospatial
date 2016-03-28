'use strict';

var util = require('util'),
	_ = require('lodash');

module.exports = function(){

	//query samples -->	
	//http://thejerm.com:8983/solr/foil_data/select?q=location:%22IsWithin(POLYGON((-73.11114033203125%2040.89478062312053,-73.11114033203125%2040.56801820354394,-74.86345966796875%2040.56801820354394,-74.86345966796875%2040.89478062312053,-73.11114033203125%2040.89478062312053)))%22&date:[2012-02-28T05:00:00.000Z%20TO%202016-02-01T05:00:00.000Z]&facet=true&facet.pivot={!key=types}type,1_location
	//http://thejerm.com:8983/solr/foil_points/select?q=*:*&fq=location:%22IsWithin(POLYGON((-72.2349806640625%2041.10035648535923,-72.2349806640625%2040.36150379928293,-75.7396193359375%2040.36150379928293,-75.7396193359375%2041.10035648535923,-72.2349806640625%2041.10035648535923)))%22&fq=date:[2012-02-27T02:07:06.000Z%20TO%202016-02-28T02:07:06.000Z]&wt=json&indent=true&rows=0&facet=true&facet.pivot={!key=types}type,1_location

	//gridbased distances -->
	//http://gis.stackexchange.com/questions/8650/how-to-measure-the-accuracy-of-latitude-and-longitude#answer-8674
	
	var rowsCeil = 9999999;
	this.translate = function(stateParams){
		var solrQuery = { filter:[], query: util.format('location:\"IsWithin(%s)\"', stateParams.polygon) };
		solrQuery = translatePickupsAndDropoffsQueryFromStateParams(stateParams, solrQuery);
		solrQuery = translateStartAndEndDateFromStateParams(stateParams, solrQuery);
		solrQuery = addFacetsToQuery(stateParams, solrQuery);
		return solrQuery;
	}

	function translatePickupsAndDropoffsQueryFromStateParams(stateParams, currentQuery){		
		if (stateParams.pickups === 'true' && stateParams.dropoffs === 'true'){ 
			return currentQuery; 
		}

		if (stateParams.pickups !== 'true' && stateParams.dropoffs !== 'true'){ 
			currentQuery.filter.push('-(type:pickup) AND -(type:dropoff)'); 
			return currentQuery;
		}

		if (stateParams.pickups === 'true') { currentQuery.filter.push('type:pickup') }
		if (stateParams.dropoffs === 'true'){ currentQuery.filter.push('type:dropoff') }

		return currentQuery;
	}

    function translateStartAndEndDateFromStateParams(stateParams, currentQuery){
    	currentQuery.filter.push(util.format('date:[%s TO %s]', stateParams.startDate, stateParams.endDate));
    	return currentQuery;
    }

	function addFacetsToQuery(stateParams, currentQuery){

		return _.extend(currentQuery, {
			"facet": {
			    "cluster": {
			        "type" : "terms",
			        "field": util.format('%s_gridcluster', stateParams.zoom.toLatLonTruncPrefix()),
			        "limit": rowsCeil,
			        "facet": {
			            "type": {
			                "type" : "terms",
			                "field": "type",
			                "sort" : "index",
			                "limit": rowsCeil,
							"facet": {
								"date":{
								    "type" : "terms",
								    "field": "date",
								    "limit": 1
								}
							}
			            },
			            "lat": {
			                "type" : "terms",
			                "field": util.format('%s_centroid_lat', stateParams.zoom.toLatLonTruncPrefix()),
			                "limit": 1
			            },
			            "lon": {
			                "type" : "terms",
			                "field": util.format('%s_centroid_lon', stateParams.zoom.toLatLonTruncPrefix()),
			                "limit": 1
			            }
			        }
			    }
			}
		});
	}

}