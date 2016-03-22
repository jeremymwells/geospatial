

module.exports = function($state){
	return {
		restrict: 'E',
		templateUrl:'/directives/tools/mapDirections.directive.html',
		scope:{ },
		controller: function($scope, $element, $attrs, $uibModal) {
			var self = this;

			//displays the directions modal dialog-->
			$scope.info = function(){

				self.modalInstance = $uibModal.open({
					animation: true,
					templateUrl:'infoModal.html',
					controller: function($scope){

						//closes the directions modal dialog
						$scope.ok = function(){
							self.modalInstance.dismiss('cancel');
						}
					}
			    });

			}

			
		}
    };
}