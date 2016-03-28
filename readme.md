
# -Caution-
##### if you are running your own db...
-	the insert script that is generated is huge...
	-	the following errors indicate the script size is a problem:
		-	`[ERROR] error executing sql script { [Error: Packets out of order. Got: 2 Expected: 3] code: 'PROTOCOL_PACKETS_OUT_OF_ORDER', fatal: true }`
		-	`[ERROR] error executing sql script { [Error: Connection lost: The server closed the connection.] fatal: true, code: 'PROTOCOL_CONNECTION_LOST' }`
-	HACK/bandaid/fix: change `max_allowed_packet` to something like `50MB` in the `[mysqld]` section of your `my.cnf` file
		-	There is a tech debt item listed below to fix this




# -To Setup App Deps-
##### `npm run setup`

# -To Setup Data For App-
##### `npm run load:db`
##### `npm run load:pre:solr`
##### `npm run load:solr`

# -To Run App-
##### `npm start`
-	open browser to http://localhost:8080


# -Available Commands, Descriptions & Usages-
##### `npm run help`
-	shows help doc

##### `npm run setup`
-   runs _npm install_ and _sudo npm install -g gulp_
- 	this is buggy --- it's better just to manually _npm install_ then _sudo npm install -g gulp_

##### `npm run load:db`
-   drops an existing table called _GeoPoints_ in package.json config.db
-   creates a table called _GeoPoints_ in package.json config.db
-	gets csv from [here](https://raw.githubusercontent.com/fivethirtyeight/uber-tlc-foil-response/master/uber-trip-data/uber-raw-data-apr14.csv)
	-	writes request result package.json > [config.inputDataFilePath].csv
	-	writes [inputDataFilePath].sql in package.json config
		-	rows from package.json [config.inputDataFilePath].csv file are converted and written into a sql script
	-	runs package.json [config.inputDataFilePath].sql script against package.json config.db

##### `npm run load:csv`
-	fetches all records from existing _GeoPoints_ table in package.json config.db section
-	writes all data rows for pickups and dropoffs to:
	-	[inputDataFilePath]_pickups_keyed.csv in package.json config
	-	[inputDataFilePath]_dropoffs_keyed.csv in package.json config

##### `npm run load:pre:solr`
-	fetches all records from existing _GeoPoints_ table in package.json config.db section.
-	creates solr docs for each record
	-	creates grid-based cluster keys/values 
		-	creates key/value by truncating lat/lon values from between 0 to 6 decimal places
	-	calculates centroids for grid-based cluster levels
	-	writes solr docs in csv formate to [centroidedSolrDocsCSVPath] in package.json config section.

##### `npm run load:solr`
-	curls [centroidedSolrDocsCSVPath] file contents (package.json config section) to solr, creating documents

##### `npm start`
-	starts app

##### `npm install`
-   installs app deps 




# -Tech Debt & Things To Improve-

-	~~User should only be able to draw one polygon at a time~~
	-	~~existing polygon should disappear when starting a new polygon~~
-	Clustering needs fixed/improved 
	-	Implement visual cue to denote whether cluster is server-side or client-side cluster?
	-	Make rules around clustering smarter
		-	server/client clustering could be used exclusively when it makes the sense to use either/or
-	Improve documentation
	-	Install jsdoc and make sure output is correct
-	~~Minify/uglify and cache html, js, etc~~
-	~~turn on server compression~~
-	`npm run load:db` sql insert script should be broken into reasonably-sized chunks of scripts
-	Automatically draw polygon when route param reflects a user-drawn polygon.
-	~~Add a groupings tool to the toolbar, eg: pickups and dropoffs~~
-	change db user permissions
	-	less privileged user should be used
-	~~change initial points-loading call to a post-init function~~
	-	~~it's currently done as a matter of set up, which means, depending on conditions, it could get fired more than necessary~~
-	~~Everything should be URL driven~~
	-	~~url should contain current geometry and zoom~~
-	keep track of points loaded into the map
	-	only load diff points NOT in the map for each new user action
	-	break up clusters as the user zooms in, and retain the loaded and more precise points as the user zooms back out
	-	look at performance implications of retaining all points of broken up clusters
		-	consider re-clustering as a means of mitigating performance concerns.
		-	consider caching or storing user temporal cluster data

