var util = require('util');

module.exports = {
	configurations:[
		{
			position: google.maps.ControlPosition.TOP_CENTER,
			directiveLink: function($state){
				return util.format('<date-range-picker date="\'%s\'" temporal="\'startDate\'"></date-range-picker>', $state.params.startDate)
			}
		}, 
		{
			position: google.maps.ControlPosition.TOP_CENTER,
			directiveLink: function($state){
				return util.format('<date-range-picker date="\'%s\'" temporal="\'endDate\'"></date-range-picker>', $state.params.endDate)
			}
		}
	]
}