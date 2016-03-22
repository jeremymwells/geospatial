'use strict';
var q = require('q'),
	solrLoader = require('./solr/solr.loader'),
	dataLoader = require('./data/data.loader');

var usage = (function() {/*
   Usage:

	npm start
		- transpiles, bundles and minifies client js
		- starts web server

	npm run load:db
		- drops and recreates db
		- makes http request for csv data
		- converts pairs of csv rows to db records, which represet a trip (pickup point and dropoff point)
		- writes rows to db

	npm run load:csv
		- fetches all records from db
		- writes a csv file for pickups
		- writes a csv file for dropoffs

	npm run load:pre:solr
		- prepares solr docs for solr import
		- 	fetches all records from db
		- 	converts each record to solr-indexable document with leveled centroid facets
		- 	writes results to csv

	npm run load:solr
	    - posts the csv prepared in previous step to solr
	    -	if you encounter issues with this, it might be due to the command being a hard-coded curl

   ...to run multiple, add them as npm args:
		npm run load:db -- load:csv load:solr 

*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

function getHandlesToAction(arg) {
	if (arg === 'load:db') { return dataLoader.loadDb(); }
	if (arg === 'load:csv') { return dataLoader.writePickupAnddropoffCsv(); }
	if (arg === 'load:pre:solr') { return solrLoader.prepareSolrDocsAsCSVForImport(); }
}

function convertArgumentsToCommands(args) {
	var actions = args ? [] : [ getHandlesToAction() ];
	for (var i = 0; i < args.length; i++) {
		actions.push(getHandlesToAction(args[i]));
	}
	return actions;
}

var server = undefined;

var args = process.argv;

if (!args.length || args.indexOf('help') !== -1){ console.log(usage); process.exit(); }

var commands = convertArgumentsToCommands(args);

q.all(commands)
	.then(function(){
		console.log('result: ', JSON.stringify(Array.prototype.slice.call(arguments)));
		process.exit();
	})
	.catch(function(err){
		console.error('[ERROR] There was an error', err, err.stack);
		process.exit();
	});



