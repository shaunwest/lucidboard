(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('editColumns', ['board', 'api', function(board, api) {
      return {
        restrict: 'E',
        templateUrl: '/templates/_editColumns.html',
        scope: {
          board: '='
        },
        link: function(scope, elm, attr) {
          scope.error = false;

          scope.createColumn = function() {
            if(!scope.title) {
              scope.error = true;
              return;
            }
            api.columnCreate(board.id(), {title: scope.title});
            scope.title = '';
            scope.error = false;
          };
        }
      };
    }]);
})();