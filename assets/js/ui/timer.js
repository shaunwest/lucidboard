(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('timerWidget', ['api', 'timer', 'board', function(api, timer, board) {
      return {
        restrict: 'AE',
        templateUrl: '/templates/_timer.html',
        scope: {},
        link: function(scope, element, attrs) {
          scope.showTimerStart = true;
          scope.timer = timer;

          timer.onStart(function() {
            scope.showTimerStart = false;
          });

          timer.onStop(function() {
            scope.showTimerStart = true;
          });

          if (board.timerLeft() > 0) {
            timer.remaining = board.timerLeft();
            timer.start();
          }

          scope.timerStart = function () {
            api.timerStart(board.id(), board.timerLeft() > 0 ?
              timer.remaining : timer.startTime);
            return false;
          };

          scope.timerReset = function () {
            api.timerReset(board.id(), timer.startTime);
            return false;
          };

          scope.timerPause = function () {
            api.timerPause(board.id(), timer.remaining);
            return false;
          };
        }
      }
    }]);
})();