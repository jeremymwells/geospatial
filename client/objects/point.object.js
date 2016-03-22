var _ = require('lodash'),
	util = require('util');

//hack -->
//google maps complains when Object.prototype is extended.
function Point(){ return _.extend(this, Array.prototype.slice.call(arguments)[0]); }

Point.prototype.toWKTPointString = function(){
    return util.format('POINT(%s,%s)', this.lat, this.lon);
}

module.exports = Point;
