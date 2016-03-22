'use strict';
var q = require('q'),
	db = require('./db'),
	sql = require('./sql'),
	util = require('util'),
	os = require('os'),
	https = require('https'),
	http = require('http'),
	path = require('path'),
	cfg = require(process.cwd() + '/package.json').config,
	fs = require('fs'),
	_ = require('lodash'),
	moment = require('moment'),
	fileHelper = require('../common/fileHelper'),
	transformers = require('../common/transformers'),
	inputFilePath = path.join(process.cwd(), cfg.inputDataFilePath),
	keyedCsvPickupFilePath = inputFilePath + '_pickups_keyed.csv',
	keyedCsvdropoffFilePath = inputFilePath + '_dropoffs_keyed.csv',
	csvFilePath = inputFilePath + '.csv',
	sqlFilePath = inputFilePath + '._sql'; //<-- odd file extension is only here to avoid syntax highlighting in sublime

function query(q){
	return util.format(q, sql.tableName);
}



/**
 * Safely truncates {cfg.inputDataFilePath}.csv if it exists
 * Makes http request to {cfg.inputHttpData} url
 * Writes response to file {cfg.inputDataFilePath}.csv
 * @returns {Q.promise<void>} - resolves after entire response has been completely written to {cfg.inputDataFilePath}.csv
 */
function getAndWriteRawDataToCSV(){

	var defer = q.defer();
	var headerLineReceived = false;
	
	fileHelper.truncate(csvFilePath);

	var writeStream = fs.createWriteStream(csvFilePath);

	https.request(cfg.inputHttpData, function(response) {
		response.on('data', function (chunk) {
			//skip header line-->
			if (!headerLineReceived){
				var chunkParts = chunk.toString().split('\n');
				if (chunkParts.length > 1){
					headerLineReceived = true;
					//remaining lines become a chunk that matters-->
					chunk = chunkParts.slice(1,chunkParts.length).join('\n');
				}
			}
			writeStream.write(chunk);
		});

		response.on('end', function () {
			console.log('[info] input received from web and written to ' + csvFilePath);
			writeStream.end();
			defer.resolve();
		});
	}).end();

	return defer.promise;
}

/**
 * Reads file contents of {cfg.inputDataFilePath}.csv, 
 * Splits file contents into lines
 * Turns every pair of file content lines into a DataRow object
 * Aggregates all DataRow objects into result
 * @returns {Q.Promise<DataRow[]>} - resolves after all {cfg.inputDataFilePath}.csv lines have been paired and converted to DataRows
 */
function aggregateFileLinePairsIntoDataRows(){
	var dataRows = [];
	var defer = q.defer();
	try{
		fs.readFile(csvFilePath, 'utf8', function(err, content){
			var lines = content.split('\n');
			console.log(
				'[info] converting pairs of raw data rows to sql script data rows',
				'\n[info]', lines.length, 'total lines in input data file should yield', lines.length/2, 'total sql script data rows.'
			);

			var evenLinesLength = lines.length%2===0?lines.length:lines.length-1;

			for (var i =0;i<evenLinesLength;i++){
				if (i%2 === 0 && i > 1){
					var dataRow = transformers.convertCsvRowPairingToDataRow([lines[i],lines[i-1]]);
					if (dataRow){
						dataRows.push(dataRow);
					}					
				}
			}
			defer.resolve(dataRows);
		})
	}catch(err){
		console.error('[ERROR] converting csv rows to data rows:', err);
		defer.reject(err);
	}
	return defer.promise;
}

/**
 * Creates geodata table and triggers
 * @returns {Q.Promise<void>} - resolves after table has been created
 */
function createGeoPointsTable(){
	return db.getWriteResult(query(sql.createGeoPointsTableCommand))
	.then(function(result){
		console.log('[info] created table ' + sql.tableName);
		return result;
	}).catch(function(err){
		console.error('[ERROR] could not create table ' + sql.tableName, err);
		throw err;
	});
}


/**
 * Drops geodata table from database
 * @returns {Q.Promise<void>} - resolves after geodata table has been dropped
 */
function dropGeoPointsTable(){
	return db.getWriteResult(query(sql.dropTableQuery))
	.then(function(result){
		console.log('[info] dropped table ' + sql.tableName);
		return result;
	}).catch(function(err){
		if (err && err.toString().toLowerCase().indexOf('unknown table') < 0) { 
			console.error('[ERROR] dropping table ' + sql.tableName + ': ' + err);
			throw err;
		}
	});
}

/**
 * Safely truncates {cfg.inputDataFilePath}._sql file, 
 * Formats and writes DataRow[] to a bulk insert statement in {cfg.inputDataFilePath}._sql
 * @returns {Q.Promise<{cfg.inputDataFilePath}._sql} - resolves after all DataRow objects have been formatted and written to {cfg.inputDataFilePath}._sql
 */
function writeBulkInsertDataRowsSqlFile(dataRowArray){
	console.log('[info] writing sql file', sqlFilePath);
	var defer = q.defer();
	try{
		
		fileHelper.truncate(sqlFilePath);

		var writeStream = fs.createWriteStream(sqlFilePath);
		var sqlScript = util.format(query(sql.insertGeoPointsQueryStarter), sql.insertFields);

		sqlScript += transformers.convertDataRowsToInsertScriptRows(dataRowArray);

		writeStream.write(sqlScript);
		writeStream.end();
		writeStream.on('finish', function(){
			console.log('[info] sql file written')
			defer.resolve(sqlFilePath);
		});
		
	}catch(err){
		console.error('[ERROR]', err);
		defer.reject(err);
	}
	return defer.promise
}

/**
 * Safely truncates {cfg.inputDataFilePath}_keyed.csv file, 
 * Formats and writes DataRow[] to a bulk insert statement in {cfg.inputDataFilePath}._sql
 * @returns {Q.Promise<{cfg.inputDataFilePath}._sql} - resolves after all DataRow objects have been formatted and written to {cfg.inputDataFilePath}._sql
 */
function writeKeyedCsvFile(dataRowArray){
	console.log('[info] writing keyed csv file for pickups', keyedCsvPickupFilePath);
	console.log('[info] writing keyed csv file for dropoffs', keyedCsvdropoffFilePath);

	var defer = q.defer();

	try{		
		fileHelper.truncate(keyedCsvPickupFilePath);
		fileHelper.truncate(keyedCsvdropoffFilePath);

		var pickupWriteStream = fs.createWriteStream(keyedCsvPickupFilePath),
			dropoffWriteStream = fs.createWriteStream(keyedCsvdropoffFilePath);

		var rowCollections = transformers.convertDataRowsToPickupsAndDropoffs(dataRowArray);

		pickupWriteStream.write(rowCollections.csvPickupRows);
		pickupWriteStream.end();
		pickupWriteStream.on('finish', function(){
			console.log('[info] keyed csv file written for pickups');

			dropoffWriteStream.write(rowCollections.csvDropoffRows);
			dropoffWriteStream.end();
			dropoffWriteStream.on('finish', function(){

				console.log('[info] keyed csv file written for dropoffs')
				defer.resolve(keyedCsvdropoffFilePath);
			});
		});		
		
	}catch(err){
		console.error('[ERROR]', err);
		defer.reject(err);
	}
	return defer.promise
}

function loadDb(){
	return dropGeoPointsTable()
		.then(createGeoPointsTable)
		.then(getAndWriteRawDataToCSV)
		.then(aggregateFileLinePairsIntoDataRows)
		.then(writeBulkInsertDataRowsSqlFile)
		.then(function(sqlScriptFile){
			console.log('[info] executing sql script', sqlScriptFile, '(this may take a little while)');
			return db.runSqlScript(sqlScriptFile)
		})
		.then(function(){
			return db.getReadResult(query(sql.selectAllStatement));
		})
}

function getNGeoRows(n){
	return db.getReadResult(util.format(query('select * from %s limit %d'), n));
}

function writePickupAnddropoffCsv(){
	return getAllGeoRows().then(writeKeyedCsvFile);
}

function getAllGeoRows(){
	return db.getReadResult(query(sql.selectAllStatement));
}

module.exports = {
	loadDb: loadDb,
	writePickupAnddropoffCsv: writePickupAnddropoffCsv,
	getAllGeoRows: getAllGeoRows,
	getNGeoRows: getNGeoRows
}
