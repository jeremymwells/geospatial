var moment = require('moment'),
	util = require('util'),
	cfg = require('../../package.json').config;
//http://gis.stackexchange.com/questions/8650/how-to-measure-the-accuracy-of-latitude-and-longitude#answer-8674
module.exports = function(queryTranslatorSvc, $http, $q){
	var self = this;

	this.getSolrPointsFromStateQuery = function(stateParams){
		return self.getSolrPoints(queryTranslatorSvc.translate(stateParams));
	}

	this.getSolrPoints = function(query){
		return $http.post('/points/solr', query).then(function(resp){
			return resp.data;
		}).catch(function(err){
			console.log('error!!!!', err)
		});
	}

	this.getClusters = function(query){
		return $http.post('/points/solr/clusters', query).then(function(resp){
			return resp.data;
		});
	}

	/**
     * Gets first point in solr
     * @returns {Promise<solr>}
     */
	this.getInitialPoint = function(){
		return $http.post('/points/solr/getFirst').then(function(resp){
			// console.log('first point resp:', resp)
			return resp.data.response.docs[0];
		});
	}


}	