'use strict';

var util = require('util');

module.exports = function(facetTranslatorSvc, groupingTranslatorSvc){
	var self = this;
	this.currentTranslator = facetTranslatorSvc;

	this.translate = function(stateParams){
		return self.currentTranslator.translate(stateParams);
	}


}