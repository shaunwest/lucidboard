(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('boardlistItem', [function() {
      return {
        restrict: 'E',
        templateUrl: '/templates/_boardlistItem.html',
        scope: {
          board:     '=',
          deletable: '='
        }
      };
    }])

})();
