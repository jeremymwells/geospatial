var moment = require('moment');

module.exports = function($state){
	return {
		restrict: 'E',
		templateUrl:'/directives/tools/toggleHeatMap.directive.html',
		scope:{ },
		controller: function($scope, $element, $attrs, mapSvc) {
			//toggle heatmap on/off-->
			$scope.toggleHeatMap = function(){
				$state.params.heatmap = $state.params.heatmap === 'true' ? false : true;
				$state.go($state.current, $state.params, {notify:false}).then(function(state){
					mapSvc.updateMap();
				})
			}

			$scope.heatmapIsOn = function(){
				return $state.params.heatmap === 'true';
			}
		}
    };
}