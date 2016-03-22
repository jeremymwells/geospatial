var cfg = require('../../package.json').config,
	q = require('q'),
	curl = require('curlrequest'),
	util = require('util'),
	request = require('request'),
	fileHelper = require('../common/fileHelper'),
	transformers = require('../common/transformers');
	path= require('path'),
	_ = require('lodash'),
	http = require('http');

//TODO rewrite _all_ of this hokey goofiness as a more intuitive/friendly thing-->

function writeCSV(csvText){
	return fileHelper.writeToFile(cfg.centroidedSolrDocsCSVPath, csvText);
}

function defaultCollectionInterpolator(reqConf){
	return _.extend(_.cloneDeep(reqConf), { path: util.format(reqConf.path, cfg.solrServer.collection) })
}

function proxyRequest(reqConfig, postData, interpolateFn){

	var defer = q.defer(),
		resp = new Buffer(0),
		reqConfig = _.extend(_.cloneDeep(cfg.solrServer), (interpolateFn || defaultCollectionInterpolator)(reqConfig));

	if (postData) { 
		postData = JSON.stringify(postData);
		console.log('[info] postData has been serialized')
		console.log(postData);
		if (reqConfig.method.toLowerCase() === 'post'){
			_.extend(reqConfig.headers, { "Content-Length": postData.length });
		}
	}	

	console.log('[info] Request params: ', reqConfig);
	var request = http.request(reqConfig, function(response) {
		response.on('data', function (chunk) {
			resp = Buffer.concat([resp, chunk]);
		});

		response.on('end', function () {
			console.log('[info] request finished');
			defer.resolve(JSON.parse(resp.toString('utf8')));
		});
	})

	request.on('error', function (err) {
		console.log('[error]', err);
		// defer.reject(err);
	});

	if (postData){
		request.write(postData);
	}
	request.end();

	

	return defer.promise;
}

function sendSelectRequest(params, interpolateFn){	 
	return proxyRequest(cfg.solrSelectPoints, params, interpolateFn);
}

function sendUpdateRequest(params, interpolateFn){
	return proxyRequest(cfg.solrUpdatePointsJSON, params, interpolateFn);
}

function sendDeleteRequest(interpolateFn){
	return proxyRequest(cfg.solrDeletePoints, false, interpolateFn);
}

function transformResponseForClient(serverResult){
	console.log(serverResult);
	return transformers.convertServerResultsFacetsToClientResult(serverResult.facets);
}

module.exports = {
	sendSelectRequest:sendSelectRequest,
	sendUpdateRequest:sendUpdateRequest,
	sendDeleteRequest:sendDeleteRequest,
	writeCSV:writeCSV,
	transformResponseForClient:transformResponseForClient
}


