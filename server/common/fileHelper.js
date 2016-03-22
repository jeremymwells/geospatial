'use strict';

var q = require('q'),
	fs = require('fs'),
	path = require('path');
	

/**
 * Safely truncates a file, swallowing exceptions.
 * @param {string} filpath - The filepath of the file to truncate.
 * @returns {void}
 */
function safelyTruncateFile(filepath){
	//if the file doesn't exist, it's effectively truncated-->
	try{ fs.truncateSync(filepath,0); }catch(z) { }
}

function getReadStream(filePath){
	var defer = q.defer(),
		readStream = fs.createReadStream(filePath);

	readStream.on('open', function () {
		defer.resolve(readStream);
	});
	readStream.on('error', function(err) {
		defer.reject(err);
	});
	return defer.promise;
}

function writeToFile(filePath, contents){

	filePath = path.join(process.cwd(), filePath);
	console.log('[info] writing file', filePath);
	var defer = q.defer();
	try{
		
		safelyTruncateFile(filePath);

		var writeStream = fs.createWriteStream(filePath);
		writeStream.write(contents);
		writeStream.end();
		writeStream.on('finish', function(){
			console.log('[info] file written')
			defer.resolve(filePath);
		});
		
	}catch(err){
		console.error('[ERROR]', err);
		defer.reject(err);
	}
	return defer.promise
}


module.exports = {
	truncate: safelyTruncateFile,
	writeToFile: writeToFile,
	getReadStream: getReadStream
}