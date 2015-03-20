(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('timer', ['api', 'timer', 'board', function(api, timer, board) {
      return {
        restrict: 'AE',
        templateUrl: '/templates/_timer.html',
        scope: {showForm: '='},
        link: function(scope, element, attrs) {
          scope.showTimerStart = true;
          scope.timer = timer;

          timer.onStart(function() {
            scope.showTimerStart = false;
          });

          timer.onStop(function() {
            scope.showTimerStart = true;
          });

          if (board.timerRunning()) {
            timer.remaining = board.timerLeft();
            timer.start();
          } else {
            scope.showTimerStart = true;
            timer.remaining = board.timerLength();
          }

          scope.preventDefault = function($event) {
            $event.stopPropagation();
            $event.preventDefault();
          };

          scope.timerStart = function ($event) {
            api.timerStart(board.id(), board.timerLeft() > 0 ?
              timer.remaining : timer.startTime);
            $event.stopPropagation();
            $event.preventDefault();
          };

          scope.timerReset = function () {
            api.timerReset(board.id(), timer.startTime);
            return false;
          };

          scope.timerPause = function ($event) {
            api.timerPause(board.id(), timer.remaining);
            $event.stopPropagation();
            $event.preventDefault();
          };
        }
      }
    }]);
})();