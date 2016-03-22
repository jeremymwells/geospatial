var moment = require('moment');

module.exports = function($state){
	return {
		restrict: 'E',
		templateUrl:'/directives/tools/toggleHeatMap.directive.html',
		scope:{ },
		controller: function($scope, $element, $attrs, mapSvc) {

			//toggle heatmap on/off-->
			$scope.toggleHeatMap = function(){
				mapSvc.toggleMap();
			}
		}
    };
}