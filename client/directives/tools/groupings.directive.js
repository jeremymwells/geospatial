var moment = require('moment');

module.exports = function($state){
	return {
		restrict: 'E',
		templateUrl:'/directives/tools/groupings.directive.html',
		scope:{ },
		controller: function($scope, $state, mapSvc) {
			$scope.pickups = $state.params.pickups === 'true';
			$scope.dropoffs = $state.params.dropoffs === 'true';
			$scope.change = function(pickupsOrDropoffs){
				$state.params[pickupsOrDropoffs] = $scope[pickupsOrDropoffs];
				$state.go($state.current, $state.params, {notify:false}).then(function(state){
					mapSvc.updateMap();
				})
			}
		}

    };
}