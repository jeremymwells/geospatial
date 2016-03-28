var directiveCfgs = [
	require('../directives/tools/dateRangePicker.config'),
	// require('../directives/tools/filter.config'),
	require('../directives/tools/groupings.config'),
	require('../directives/tools/mapLegend.config'),
	// require('../directives/tools/mapDirections.config'),
	// require('../directives/tools/stats.config'),
	require('../directives/tools/toggleHeatMap.config')
];


function toolsSvc($compile, $q){

	function compileDirective(directive, scope){
		return $compile(directive)(scope)[0];
	}


	function registerDirectiveWithMap(config, map){
		var directive = angular.element(map.config.element).injector().invoke(config.directiveLink);
		return compileDirective(directive, map.config.scope)
	}

	this.compile = function(map){

		//all of the directive configs -->
		directiveCfgs.forEach(function(directiveCfg){
			//all the configs in each directive config -->
			directiveCfg.configurations.forEach(function(config){
				map.gMap.controls[config.position].push(registerDirectiveWithMap(config, map));
			})
		})

		return $q(function(resolve){resolve(map)});
	}


	
}

module.exports = toolsSvc;