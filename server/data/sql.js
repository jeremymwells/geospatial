'use strict';

module.exports = {
	tableName:'geodata',

	selectAllStatement: 'SELECT * FROM %s;',

	dropTableQuery: 'DROP TABLE %s;',

	insertFields: `pickup_date,dropoff_date,pickup_lat,pickup_lon,dropoff_lat,dropoff_lon,base,pickup,dropoff`,

	insertGeoPointsQueryStarter: `INSERT INTO %s (%s) VALUES
	`,

	createGeoPointsTableCommand: `SET default_storage_engine=MYISAM; 
									CREATE TABLE %s
									( 
									  id int NOT NULL AUTO_INCREMENT PRIMARY KEY, 
									  pickup_date DATETIME NOT NULL, 
									  dropoff_date DATETIME NOT NULL, 
									  pickup_lat DECIMAL(9,6) NOT NULL, 
									  pickup_lon DECIMAL(9,6) NOT NULL, 
									  dropoff_lat DECIMAL(9,6) NOT NULL, 
									  dropoff_lon DECIMAL(9,6) NOT NULL, 
									  base varchar(50),
									  pickup POINT NOT NULL, 
									  dropoff POINT NOT NULL, 
									  UNIQUE KEY id (id), 
									  KEY pickup_date (pickup_date),
									  KEY dropoff_date (dropoff_date),
									  KEY pickup_lat (pickup_lat), 
									  KEY pickup_lon (pickup_lon), 
									  KEY dropoff_lat (dropoff_lat),  
									  KEY dropoff_lon (dropoff_lon),  
									  SPATIAL KEY pickup (pickup), 
									  SPATIAL KEY dropoff (dropoff)
									);`,

	
	pickupClusteredQuery: `SET @poly = %s;

							SELECT 
								count(*) count,
								TRUNCATE(gp.pickup_lat, %d) t_lat,
								TRUNCATE(gp.pickup_lon, %d) t_lon,
								gp.pickup_date, 
								gp.dropoff_date, 
								gp.pickup, 
								gp.dropoff
							FROM
								geodata gp 
							WHERE
								(gp.pickup_date BETWEEN '%s' AND '%s')  
								AND (gp.dropoff_date BETWEEN '%s' AND '%s') 
								AND (st_contains(@poly, gp.pickup) AND st_contains(@poly, gp.dropoff))
							GROUP BY
								t_lat, t_lon
							ORDER BY count DESC`

};