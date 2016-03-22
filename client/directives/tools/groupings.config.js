var util = require('util');

module.exports = {
	configurations:[
		{
			position: google.maps.ControlPosition.TOP_CENTER,
			directiveLink: function($state) {
				return util.format('<groupings></groupings>', $state.params.startDate)
			}
		}
	]
}