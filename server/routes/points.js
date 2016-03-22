var express = require('express'),
	router = express.Router();

var dataService = require('../data/data.service'),
	solrService = require('../solr/solr.service');

//reads map query and returns results-->
router.post('/data', function(req, res) {

	dataService.runMapQuery(req.body)
		.then(function(results){
			res.send(results);
		});

});

router.post('/solr', function(req, res) {
	solrService.sendSelectRequest(req.body)
		.then(solrService.transformResponseForClient)
		.then(function(results){
			res.send(results);
		});

});

router.post('/solr/clusters', function(req, res) {
	solrService.sendSelectRequest(req.body)
		.then(solrService.transformResponseForClient)
		.then(function(results){
			console.log(results);
			res.send(results);
		});

});

router.post('/solr/getFirst', function(req, res) {

	solrService.sendSelectRequest({params:{wt:'json', rows:1, q:'*:*'}})
		.then(function(results){
			res.send(results);
		});

});

router.get('/getFirst', function(req, res) {
	
	dataService.getFirstPoint()
		.then(function(point){
			res.send(point);
		});

});


module.exports = router;
