(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('timer', ['api', 'board', 'view',
      function(api, board, view) {
      return {
        restrict: 'AE',
        templateUrl: '/templates/_timer.html',
        scope: {showForm: '='},
        link: function(scope, element, attrs) {

          scope.board = board;
          scope.view  = view;

          scope.preventDefault = function($event) {
            $event.stopPropagation();
            $event.preventDefault();
          };

          scope.timerStart = function($event) {
            var seconds = view.timer.inputInSeconds();
            $event.stopPropagation();
            $event.preventDefault();
            if (seconds) api.timerStart(board.id, seconds);
            return false;
          };

          scope.timerReset = function($event) {
            api.timerPause(board.id, board.timer.startTime);
            $event.stopPropagation();
            $event.preventDefault();
            return false;
          };

          scope.timerPause = function($event) {
            api.timerPause(board.id, board.timer.remaining);
            $event.stopPropagation();
            $event.preventDefault();
            return false;
          };
        }
      }
    }]);
})();
