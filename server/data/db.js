var mysql = require('mysql'),
	fs = require('fs'),
	cfg = require(process.cwd() + '/package.json').config,
	q = require('q'),
	mysqlPool = mysql.createPool({
		host: cfg.db.address,
		port: cfg.db.port,
		user: cfg.db.user.name,
		password: cfg.db.user.password, 
		database: cfg.db.name, 
		connectTimeout: parseInt(cfg.db.connectTimeout),
		connectionLimit: parseInt(cfg.db.connectionLimit),
		multipleStatements: true
	});

/**
 * Wraps a function in a promise and hands the function a pooled db connection
 * @param {function} fn - The function to wrap and give connection to
 * @returns {Promise<any>}
 */
var pooledConn = function(fn){
	var defer = q.defer();
	mysqlPool.getConnection(function(err, conn){
		if (err){ console.log('[ERROR] error getting mysql connection'); q.reject(err); }		
		defer.resolve(fn(conn));
		conn.release();
	});
	return defer.promise;
}

/**
 * Reads a file and sends its contents to the database as a query
 * @param {string} sqlFile - The file path of the file to be read
 * @returns {Promise<databaseResults>}
 */
var runSqlScript = function(sqlFile){
	var defer = q.defer();
	fs.readFile(sqlFile, 'utf8', function(err, sql){
		if (err) { console.error('[ERROR] error reading sql script', err); defer.reject(err);  }
		readQuery(sql.toString('utf8'))
			.then(function(result){ defer.resolve(result); })
			.catch(function(ex){ defer.reject(ex); });
	});	
	return defer.promise;
}

/**
 * Runs a query against the db
 * @param {string} query - The query to run
 * @returns {Promise<databaseResults>}
 */
var readQuery = function(query){
	return pooledConn(function(connection){
		var defer = q.defer();
		connection.query(query,function(error, result){
			if (error){ console.error('[ERROR] error executing sql script', error);	defer.reject(error); }
			defer.resolve(result);
		});
		return defer.promise;
	});	
}



module.exports = {
	getReadResult: readQuery,
	getWriteResult: readQuery,
	runSqlScript: runSqlScript
}
