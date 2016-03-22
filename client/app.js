
var _ = require('lodash');
var angular = require('angular');

var typeExtensions = require('./objects/typeExtensions');
var mapService = require('./services/map.service');
var markerLabelerService = require('./services/markerLabeler.service');
var solrService = require('./services/solr.service');
var queryTranslatorService = require('./services/queryTranslator.service');
var facetTranslatorService = require('./services/facetTranslator.service');
var groupingTranslatorService = require('./services/groupingTranslator.service');
var toolsService = require('./services/tools.service.js');

var googleMapDirective = require('./directives/googleMap.directive');
var dateRangePickerDirective = require('./directives/tools/dateRangePicker.directive');
var groupingsDirective = require('./directives/tools/groupings.directive');
var statsDirective = require('./directives/tools/stats.directive');
var mapDirections = require('./directives/tools/mapDirections.directive');
var toggleHeatMap = require('./directives/tools/toggleHeatMap.directive');
var filterModal = require('./directives/tools/filter.directive');
var mapLegend = require('./directives/tools/mapLegend.directive');

angular.module('foil', [require('angular-ui-bootstrap'), require('angular-ui-router')])

 .config(function($stateProvider, $urlRouterProvider) {
 
    $urlRouterProvider.otherwise("/map/view");

    $stateProvider
      .state('map', {
        abstract:true,
        templateUrl: '/routes/map/layout.html'
      })
      .state('map.view', {
        url: '/map/view?pickups&dropoffs&mapCenter&polygon&zoom&startDate&endDate',
        templateUrl: '/routes/map/view/map.html',
        params:{ zoom: '', polygon: '', startDate:'', endDate: '', dropoffs: '', pickups: '', mapCenter:'' }
      })
      ;

    

  })
  .run(function($rootScope, mapSvc){
    $rootScope.$on('$stateChangeError',function(event, toState, toParams, fromState, fromParams, error){
      console.log('state change error!', error)
    })
    $rootScope.mapSvcIsLoading = function(){
      return mapSvc.loading
    }
  })

 .service('mapSvc', mapService)
 .service('markerLabelerSvc', markerLabelerService)
 .service('solrSvc', solrService)
 .service('queryTranslatorSvc', queryTranslatorService)
 .service('facetTranslatorSvc', facetTranslatorService)
 .service('groupingTranslatorSvc', groupingTranslatorService)
 .service('toolsSvc', toolsService)

 .directive('mapLegend', mapLegend)
 .directive('filterModal', filterModal)
 .directive('googleMap', googleMapDirective)
 .directive('dateRangePicker', dateRangePickerDirective)
 .directive('groupings', groupingsDirective)
 .directive('stats', statsDirective)
 .directive('mapDirections', mapDirections)
 .directive('toggleHeatMap', toggleHeatMap)
  ;







