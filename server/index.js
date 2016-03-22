var express = require('express'),
	path = require('path'),
	cfg = require('../package.json').config,
	bodyParser = require('body-parser'),
	compression = require('compression');

	app = express();

	//handle post reqs-->
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	//compression-->
	app.use(compression({
		filter: function(req, res) {
		  if (req.headers['x-no-compression']) { return false; }  	
		  return compression.filter(req, res);
		}
	}));

	app.use(function(err, req, res, next) {
	  console.error(err.stack);
	  res.status(500).send(err);
	});

	//add routes -->
	app.use('/', express.static(path.join(process.cwd(), 'client'), { index: 'index.html' }));
	app.use('/points', require('./routes/points'));

	//start server -->
	var server = app.listen(cfg.server.port, function() {
	  console.log('Server running on port ' + server.address().port);
	});
