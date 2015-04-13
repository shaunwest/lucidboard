(function() {
  'use strict';
  angular.module('hansei.ui')
    .directive('cardSlot', ['board', function(board) {
      return {
        restrict: 'E',
        templateUrl: '/templates/_cardSlot.html',
        scope: {
          item:   '=',
          column: '=',
          index:  '='
        },
        link: function(scope, element) {
          scope.board = board;
        }
      };
    }]);
})();
