var moment = require('moment'),
      _ = require('lodash');


module.exports = function($state, mapSvc){
	return {
            restrict: 'E',      
            templateUrl:'/directives/tools/dateRangePicker.directive.html',
            scope:{
                  date:'=',
                  temporal:'='
            },
            controller: function($scope, $element, $attrs, $state, solrSvc) {
                  $scope.startOrEnd = $scope.temporal === 'startDate' ? 'start' : 'end';

                  $scope.datepickerOptions = { initDate: new Date($scope.date) };

                  $scope.getDisplayDate = function(){ return moment($scope.date).format('MM/DD/YYYY').toString(); }

                  $scope.handleDateChange = function handleDateChange(){
                        var date = {};
                        date[$scope.temporal] = moment($scope.date).toISOString();
                        $state.go($state.current, _.assign($state.params, date)).then(mapSvc.updateMap);
                  };
            }
      };
}



