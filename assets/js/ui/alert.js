(function() {
  'use strict';
  
  angular.module('hansei.ui')
    .directive('alert', ['view', function(view) {
      return {
        restrict:    'A',
        templateUrl: '/templates/_alert.html',
        replace:     true,
        transclude:  true,
        link: function(scope, element, attrs) {
          scope.view = view;
        }
      };
    }])
})();
