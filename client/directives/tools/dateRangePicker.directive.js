var moment = require('moment'),
      _ = require('lodash');


module.exports = function($state){
	return {
            restrict: 'E',      
            templateUrl:'/directives/tools/dateRangePicker.directive.html',
            scope:{
                  date:'=',
                  temporal:'='
            },
            controller: function($scope, $element, $attrs, $state, solrSvc) {
                  $scope.startOrEnd = $scope.temporal === 'startDate' ? 'start' : 'end';

                  $scope.getDisplayDate = function(){ return moment($scope.date).format('MM/DD/YYYY').toString(); }

                  $scope.handleDateChange = function handleDateChange(){
                        var date = {};
                        date[$scope.temporal] = $scope.date;

                        $state.go($state.current, _.assign($state.params, moment(date).toISOString())).then(function(){
                              return solrSvc.getSolrPoints($state.params);
                        })
                  };
            }
      };
}



