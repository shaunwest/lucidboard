(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('editColumns', ['$timeout', 'board', 'api', 'config',
    function($timeout, board, api, config) {
      return {
        restrict: 'E',
        templateUrl: '/templates/_editColumns.html',
        link: function(scope, elm, attr) {
          scope.error = false;
          scope.board = board;

          // keys are column ids. When corresponding vals are set to true, the delete
          // confirmation will be shown.
          scope.deleteToggles = {};

          scope.getDeleteConfirm = function(column) {
            scope.deleteToggles[column.id] = true;
            $timeout(function() { delete scope.deleteToggles[column.id]; }, 4000);
          };

          scope.checkColumnTitle = function(title, columnId) {
            if (!title.match(config.regex.columnTitle)) return 'Invalid title';
            api.columnUpdate(board.id, {id: columnId, title: title});
            // the false returned will close the editor and not update the model.
            // (model update will happen when the event is pushed from the server)
            return false;
          };

          scope.deleteColumn = function(column) {
            api.columnDelete(board.id, column.id);
          };

          scope.createColumn = function() {
            if (!scope.title) {
              scope.error = true;
              return;
            }
            api.columnCreate(board.id, {title: scope.title});
            scope.title = '';
            scope.error = false;
          };

          scope.moveColumn = function(column, position) {
            api.columnMove(board.id, column.id, position);
          };
        }
      };
    }]);
})();
