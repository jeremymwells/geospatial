var moment = require('moment');

module.exports = function($state){
	return {
		restrict: 'E',
		templateUrl:'/directives/tools/filter.directive.html',
		scope:{ },
		controller: function($scope, $element, $attrs, $uibModal) {
			var self = this;

			//shows stats modal-->
			$scope.showStats = function(){

				self.modalInstance = $uibModal.open({
					animation: true,
					templateUrl:'statsModal.html',
					controller: function($scope, mapSvc){
						$scope.mapSvc = mapSvc;

						//closes stats modal -->
						$scope.ok = function(){
							self.modalInstance.dismiss('cancel');
						}

						//formats the marker string-->
						$scope.formatMarker = function(marker){
							return (!marker.label) ? 
								'1 point :: ' + marker.title :
								marker.label + ' points :: ' + marker.title;
						}
					}
			    });

			}

			
		}
    };
}