
var moment = require('moment'),
	util = require('util'),
	geohash = require('geo-hash'),
	q = require('q'),
	_ = require('lodash'),
	solrService = require('../solr/solr.service');

/**
 * Represents a pairing of two lines of the csv file.
 * @constructor
 */
function DataRow(csvRowPair){
	var row1Parts = csvRowPair[0].split(','),
		row2Parts = csvRowPair[1].split(',');

	this.pickup_date = moment(row1Parts[0].trim(), "M/DD/YYYY HH:mm:ss").format('YYYY-MM-DD HH:mm:ss').toString();
	this.dropoff_date = moment(row2Parts[0].trim(), "M/DD/YYYY HH:mm:ss").format('YYYY-MM-DD HH:mm:ss').toString();
	this.pickup_lat = row1Parts[1].trim(); 
	this.pickup_lon = row1Parts[2].trim();
	this.dropoff_lat = row2Parts[1].trim(); 
	this.dropoff_lon = row2Parts[2].trim();
	this.base = row1Parts[3].trim().replace(/"/g,'') + '|' + row2Parts[3].trim().replace(/"/g,'');
	return this;
}

function convertCsvRowPairingToDataRow(csvRowPair){
	return new DataRow(csvRowPair);
}

function convertDataRowsToInsertScriptRows(dataRows){
	var sqlScript='';
	for (var i=0; i<dataRows.length; i++){
		var row = dataRows[i];
		sqlScript += util.format('("%s","%s",%d,%d,%d,%d,"%s",POINT(%s,%s),POINT(%s,%s))%s',
			row.pickup_date,
			row.dropoff_date,
			row.pickup_lat,
			row.pickup_lon,
			row.dropoff_lat,
			row.dropoff_lon,
			row.base,
			row.pickup_lat,
			row.pickup_lon,
			row.dropoff_lat,
			row.dropoff_lon,
			(i===dataRows.length-1) ? ';' : ',\n'
		);			
	}
	return sqlScript;
}

function convertDataRowsToPickupsAndDropoffs(dataRows){
	var csvHeaderRow = 'id,db_id,type,date,latlon,base,point\n',
		formatString = '%d,%d,"%s","%s","%d,%d","%s",POINT(%d %d)\n',
		csvPickupRows = csvHeaderRow,
		csvDropoffRows = csvHeaderRow,
		count=0;

	for (var i=0; i<dataRows.length; i++){
		var row = dataRows[i];

		csvPickupRows += util.format(formatString,
			count++,
			row.id,
			'pickup',
			moment(row.pickup_date, 'ddd MMM DD YYYY HH:mm:ss').toISOString(),
			row.pickup_lat,
			row.pickup_lon,
			row.base,
			row.pickup_lat,
			row.pickup_lon
		);

		csvDropoffRows += util.format(formatString,
			count++,
			row.id,
			'dropoff',
			moment(row.dropoff_date, 'ddd MMM DD YYYY HH:mm:ss').toISOString(),
			row.dropoff_lat,
			row.dropoff_lon,
			row.base,
			row.dropoff_lat,
			row.dropoff_lon
		);		
	}

	return { csvPickupRows: csvPickupRows, csvDropoffRows: csvDropoffRows }
}

function hashTruncNumber(num, ceil){
	var ceil = ceil || 5,
		numParts = num.toString().split('.'),
		int = numParts[0],
		decimals = numParts[1],
		result = { 0: parseInt(int) };

	for(var i=0; i<ceil; i++){
		var first = result[i],
			middle = i===0?'.':'',
			last = (decimals && i < decimals.length) ? decimals[i] : '';

		result[i+1] = util.format('%s%s%s',first,middle,last);
	}

	return result;
}

function assignTruncations(point){
	var len = 7;
	for(var i =0;i<len;i++){
		var lat = hashTruncNumber(point.lat, len),
			lon = hashTruncNumber(point.lon, len),
			pfxKey = i + '_gridcluster',
			trunc = {};
		
		trunc[pfxKey] = util.format('%s,%s',lat[i],lon[i]);

		_.assign(point, trunc);
	}

	return point;
}

function convertDataRowsToSolrDocuments(dataRows){

	var points = [];

	for(var i = 0;i<dataRows.length;i++){
		var bases = dataRows[i].base.split('|'),
			p_base = bases[0],
			d_base = bases[1];

		var pickup = assignTruncations({
			db_id 	: dataRows[i].id,
			id 		: i,
			type 	: 'pickup',			
			date 	: moment(dataRows[i].pickup_date, 'ddd MMM DD YYYY HH:mm:ss').toISOString(),
			lat 	: dataRows[i].pickup_lat,
			lon 	: dataRows[i].pickup_lon,
			base 	: p_base.trim(),
			location: util.format('%s,%s',dataRows[i].pickup_lat,dataRows[i].pickup_lon),
			geohash : geohash.encode(dataRows[i].pickup_lat, dataRows[i].pickup_lon, 10)
		});

		var dropoff = assignTruncations({
			db_id 	: dataRows[i].id,
			id 		: i + dataRows.length,
			type 	: 'dropoff',
			date 	: moment(dataRows[i].dropoff_date, 'ddd MMM DD YYYY HH:mm:ss').toISOString(),
			lat 	: dataRows[i].dropoff_lat,
			lon 	: dataRows[i].dropoff_lon,
			base 	: d_base.trim(),
			location: util.format('%s,%s',dataRows[i].dropoff_lat,dataRows[i].dropoff_lon),
			geohash : geohash.encode(dataRows[i].dropoff_lat, dataRows[i].dropoff_lon, 10)
		});

		points.push(pickup);
		points.push(dropoff);

	}

	// for(var i = 0; i<points.length;i++){
	// 	points[i] = assignGeoHashPrefixes(points[i]);
	// }

	return points;
}

function sumDocGroupsLatLon(groups, doc){
	for(var i=0;i<=6;i++){
		var key = util.format('%s_gridcluster',i);
		if (!groups[i][doc[key]]){
			groups[i][doc[key]] = {lat:0,lon:0,docs:[]};
		}

		groups[i][doc[key]].lat += doc.lat;
		groups[i][doc[key]].lon += doc.lon;
		groups[i][doc[key]].docs.push(doc);
	}
}

function prepareForCartesian(solrDocuments){
	var groups = {0:{},1:{},2:{},3:{},4:{},5:{},6:{}},
		keyedDocs = {};

	for(var i =0; i<solrDocuments.length; i++){
		var doc = solrDocuments[i];
		sumDocGroupsLatLon(groups, doc);
		keyedDocs[doc.id] = doc;
	}

	return { groups: groups, keyedDocs: keyedDocs };
}

function convertLeveledCentroidedJSONToCSV(collection){
	function convert(doc){
		return util.format(
			//db_id, id, type, date, lat, lon, base, location, geohash
			'%d,%d,"%s","%s",%d,%d,"%s","%s","%s",' + 
			//0_gridcluster,1_gridcluster,2_gridcluster,3_gridcluster,4_gridcluster,5_gridcluster,6_gridcluster
			'"%s","%s","%s","%s","%s","%s","%s",' +
			//0_centroid_lat,0_centroid_lon,1_centroid_lat,1_centroid_lon,2_centroid_lat,2_centroid_lon,3_centroid_lat,3_centroid_lon,4_centroid_lat,4_centroid_lon,5_centroid_lat,5_centroid_lon
			'"%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s"\n',

			doc.db_id, doc.id, doc.type, doc.date, doc.lat, doc.lon, doc.base, doc.location, doc.geohash,

			doc['0_gridcluster'], doc['1_gridcluster'], doc['2_gridcluster'],doc['3_gridcluster'],doc['4_gridcluster'],doc['5_gridcluster'],doc['6_gridcluster'],

			doc['0_centroid_lat'],doc['0_centroid_lon'],doc['1_centroid_lat'],doc['1_centroid_lon'],doc['2_centroid_lat'],doc['2_centroid_lon'],doc['3_centroid_lat'],doc['3_centroid_lon'],doc['4_centroid_lat'],doc['4_centroid_lon'],doc['5_centroid_lat'],doc['5_centroid_lon'],doc['6_centroid_lat'],doc['6_centroid_lon']

		);
	}

	var csvRows = Object.keys(collection[0]).join(',') + '\n';
	for(var i =0;i<collection.length;i++){
		csvRows += convert(collection[i]);
	}
	return csvRows;
}

function addCentroidLevelsToGridbasedClusters(preppedDocs){

	for(var level in preppedDocs.groups){

		var centroid_lat_key = level + '_centroid_lat',
			centroid_lon_key = level + '_centroid_lon';

		for(var gridbasedClusterPrefix in preppedDocs.groups[level]){

			var group = preppedDocs.groups[level][gridbasedClusterPrefix];

			for(var i =0;i<group.docs.length;i++){
				var doc = group.docs[i];

				if (preppedDocs.keyedDocs[doc.id][centroid_lat_key] || preppedDocs.keyedDocs[doc.id][centroid_lon_key]){
					console.log(	
						'keys exist!',					
						preppedDocs.keyedDocs[doc.id][centroid_lat_key],
						preppedDocs.keyedDocs[doc.id][centroid_lon_key]
					);
				}

				preppedDocs.keyedDocs[doc.id][centroid_lat_key] = group.lat/group.docs.length;
				preppedDocs.keyedDocs[doc.id][centroid_lon_key] = group.lon/group.docs.length;

			}

		}

	}

	return _.values(preppedDocs.keyedDocs);
}

function addLeveledCentroidsToSolrDocs(solrDocuments){
	return addCentroidLevelsToGridbasedClusters(prepareForCartesian(solrDocuments));
}

function convertServerResultsFacetsToClientResult(facets){
	var defer = q.defer();
 	var clusters = [];
 	var clustersLen = _.result(facets, 'cluster.buckets.length', 0);
	for (var i =0;i<clustersLen;i++){
		try{
			var currentCluster = facets.cluster.buckets[i],
				lat = currentCluster.lat.buckets[0],
				lon = currentCluster.lon.buckets[0];

	        var newCluster = {
	        	lat: lat.val,
	        	lng: lon.val,
	        	lon: lon.val,
	        	totalPointsRepresented: 0
	        };

	        for(j = 0; j < currentCluster.type.buckets.length;j++){
	        	var bucket = currentCluster.type.buckets[j];
	        	newCluster.totalPointsRepresented += bucket.count;
	        	newCluster[bucket.val + 's'] = { count : bucket.count, date: bucket.date.buckets[0].val };
	        }

	        clusters.push(newCluster);

    	}catch(z){
    		console.log('[ERROR]', z, z.stack);
    		deferred.reject(z);
    	}
    }
	
    defer.resolve(clusters);
	return defer.promise;
}

module.exports = {
	convertCsvRowPairingToDataRow: convertCsvRowPairingToDataRow,
	convertDataRowsToInsertScriptRows: convertDataRowsToInsertScriptRows,
	convertDataRowsToPickupsAndDropoffs: convertDataRowsToPickupsAndDropoffs,
	convertDataRowsToSolrDocuments: convertDataRowsToSolrDocuments,
	addLeveledCentroidsToSolrDocs: addLeveledCentroidsToSolrDocs,
	convertLeveledCentroidedJSONToCSV: convertLeveledCentroidedJSONToCSV,
	convertServerResultsFacetsToClientResult:convertServerResultsFacetsToClientResult
}