    var _ = require('lodash'),
    	util = require('util'),
    	Point = require('./point.object');

    Array.prototype.toWKTPolygonString = function(){
        var polyBody = '';

        for(var i=0;i<this.length;i++) {
            polyBody += util.format('%d %d%s', 
                this[i][1], 
                this[i][0], 
                i===this.length-1 ? '' : ','
            );
        }

        return util.format('POLYGON((%s))',polyBody);
    }

    String.prototype.toLatLonArray = function(){
        return this.replace(/POINT\(|\)/g, '').split(',').map(function(point) { return parseFloat(point); });
    }

    String.prototype.toPoint = function(){
        var latLon = this.toLatLonArray();
        return new Point({ lat:latLon[0], lon: latLon[1] });
    }

    Number.prototype.toLatLonTruncPrefix = function(){
    	var num = parseFloat(this);

		if (num > 17) { return 6; }

		if (num > 14) { return 3; }

		if (num > 11) { return 2; }

        if (num > 8) { return 1 }

		return 0;
    }
    
    String.prototype.toLatLonTruncPrefix = Number.prototype.toLatLonTruncPrefix;

    Number.prototype.toGeohashPrefix = function(){
    	var num = parseFloat(this);
    	return Math.floor(num/2) + (num%2);
    }

    String.prototype.toGeohashPrefix = Number.prototype.toGeohashPrefix;
