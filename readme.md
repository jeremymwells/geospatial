
# -Caution-
##### if you are running your own db...
-	the insert script that is generated is huge...
	-	the following errors indicate the script size is a problem:
		-	`[ERROR] error executing sql script { [Error: Packets out of order. Got: 2 Expected: 3] code: 'PROTOCOL_PACKETS_OUT_OF_ORDER', fatal: true }`
		-	`[ERROR] error executing sql script { [Error: Connection lost: The server closed the connection.] fatal: true, code: 'PROTOCOL_CONNECTION_LOST' }`
	-	HACK/bandaid/fix: change `max_allowed_packet` to something like `50MB` in the `[mysqld]` section of your `my.cnf` file
		-	TODO: break bulk insert process into smaller scripts and execute sequentially.




# -To Setup App-
##### `npm run setup`




# -To Run App-
##### `npm start`
-	open browser to http://localhost:8080




# -Available Commands, Descriptions & Usages-

##### `npm run setup`
-   runs _npm install_ and _sudo install -g gulp_

##### `npm run load_data`
-   drops an existing table called _GeoPoints_ in package.json config.db
-   creates a table called _GeoPoints_ in package.json config.db
-	gets csv from [here](https://raw.githubusercontent.com/fivethirtyeight/uber-tlc-foil-response/master/uber-trip-data/uber-raw-data-apr14.csv)
	-	writes request result package.json > [config.inputDataFilePath].csv
	-	writes package.json > [inputDataFilePath].sql
		-	rows from package.json [config.inputDataFilePath].csv are converted and written into a sql script
	-	runs package.json [config.inputDataFilePath].sql script against package.json config.db

##### `npm start`
-	starts app

##### `npm install`
-   installs app deps 






# -API summary-
### Routes
##### _{POST}_&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/points
-   returns geopoints
-	accepts a _{query}_ object
-	_{query}_ : 
```
	{ 
		pickups: true, 						//include pickups (not working)
		dropoffs: true, 					//include dropoffs (not working)
		zoom: 14, 							// zoom of the map -- is used to truncate lat/lon for pseudo-clusters
		startDate: '2012-02-01 00:39:31', 	//start date of points
		endDate: '2016-02-02 00:39:31',		//end date of points
		polygon: 							//shape to find points in
		[ [ 40.7319363795201, -73.98558606843949 ],
		 [ 40.731263618779344, -73.98558606843949 ],
		 [ 40.731263618779344, -73.98901393156052 ],
		 [ 40.7319363795201, -73.98901393156052 ],
		 [ 40.7319363795201, -73.98558606843949 ] ] 
	}
```
##### _{GET}_&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/points/getFirst
-	returns the first record in the GeoPoints table
-	this is used to set the initial point of the map







# -Tech Debt & Things To Improve-

-	User should only be able to draw one polygon at a time
	-	existing polygon should disappear when starting a new polygon
-	Add a map key and/or direct user to `?` dialog so they know what they're doing with the map
-	Clustering needs fixed/improved 
	-	Maybe solr, or geohash in sql? I know neither.
	-	The clustering in the app is kinda odd -- it truncates lat/lon and misses things.
-	Install jsdoc and make sure output is correct
-	~~Minify/uglify and cache html, js, etc~~
-	~~turn on server compression~~
-	The data loader bulk insert script should be broken into reasonably-sized chunks of scripts
-	All filters should be moved into their own dialog
	-	represent dialog via a `filter` icon in top-center toolbar
-	fix all dialogs' aesthetics
	-	They should appear to fit with the map's tooling/theme
-	When in heatmap mode, a drawn polygon should limit the heatmap.
-	Add a groupings tool to the toolbar, eg: pickups and dropoffs
-	change db user permissions
	-	less privileged user should be used
-	change initial points-loading call to a post-init function
	-	it's currently done as a matter of set up, which means, depending on conditions, it could get fired more than necessary
-	keep track of user's last-viewed map params so when they leave and come back, they're viewing their last-viewed map
-	Everything should be URL driven
	-	url should contain current geometry and zoom
-	keep track of points loaded into the map
	-	only load diff points NOT in the map for each new user action
	-	break up clusters as the user zooms in, and retain the loaded and more precise points as the user zooms back out
-	look at performance implications of retaining all points of broken up clusters
	-	consider re-clustering as a means of mitigating performance concerns.
	-	consider caching or storing user temporal cluster data



# -Notes-
-	Angular file names indicate function, eg: `map.object.js` or `mapBase.controller.js`
-	The `<google-map></google-map>` directive is where all of the map functionality kicks off
	-	The google-map directive uses the mapSvc to initialize a map object
-	There is a folder in `client/routes` for each route
	-	There is a `layout.html` file, which sets the layout for the abstract route
	-	There is a base controller in the route folder
	-	There is a child route folder in each route folder
-	There are 3 services in `clients/services`
	-	`map.service.js` called `mapSvc` in the angular app 
		-	sets up and does all the map work
	-	`points.service.js` called `pointsSvc` in the angular app
		-	makes requests to the web api
	-	`query.service.js` called `querySvc` in the angular app
		-	uses the pointsSvc to update the map query
-	There are 3 objects in the `client/objects` directory
	-	`map.object.js` encapsulates the map, sets up the drawingManager
	- 	`drawingManager.js` encapsulates the drawing tools, and compiles custom tool directives
	-	`toolCompiler.js` encapsulates the compiler that adds tools to the google map
-	A Map object encapsulates the google map and the google map drawing manager
-	`client/directives/tools` directory contains directives for the custom tools in the map

