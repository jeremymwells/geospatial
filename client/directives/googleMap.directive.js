
//initializes a google map-->

module.exports = function($state, mapSvc){

	function link(scope, element, attrs) {
		mapSvc.bootstrap(scope, element);
	}

	return {
      restrict: 'E',
      link:link
    };
}