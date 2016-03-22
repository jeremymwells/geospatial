'use strict';

var dbLoader = require('../data/data.loader'),
	cfg = require('../../package.json').config,
	solrService = require('./solr.service'),
	util = require('util'),
	path = require('path'),
	transformers = require('../common/transformers'),
	exec = require('child_process').exec,
	_ = require('lodash'), 
	q = require('q');


function prepareSolrDocsAsCSVForImport(){

	return dbLoader.getAllGeoRows()
		.then(function(dataRows){
			console.log('[info] ' + dataRows.length + ' rows received from database');

			console.log('[info] adding leveled centroids to solr documents');
			var centroidedSolrDocs = transformers.addLeveledCentroidsToSolrDocs(transformers.convertDataRowsToSolrDocuments(dataRows));
			console.log('[info] leveled centroids have been added to all gridbased cluster levels');

			console.log('[info] deleting cluster_points collection');
			return solrService.sendDeleteRequest().then(function(){
				return solrService.writeCSV(
					transformers.convertLeveledCentroidedJSONToCSV(centroidedSolrDocs)
				);
			});

	}).catch(function(e){
		console.log('ERROR!', e, e.stack);
	});
}
//curl http://thejerm.com:8983/solr/cluster_points/update/csv?commit=true --data-binary @server/solr/tmp/centroided_solr_docs.csv -H 'Content-type:text/plain; charset=utf-8'


module.exports = {
	prepareSolrDocsAsCSVForImport: prepareSolrDocsAsCSVForImport
}