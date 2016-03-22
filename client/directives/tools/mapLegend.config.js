var util = require('util');

module.exports = {
	configurations:[
		{
			position: google.maps.ControlPosition.TOP_RIGHT,
			directiveLink: function($state){
				return util.format('<map-legend class="top-right"></map-legend>', $state.params.startDate)
			}
		}
	]
}