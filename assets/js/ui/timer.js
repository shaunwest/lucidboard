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

          console.log('timer running');
          console.log(board.timerRunning());
          // Timer is set (start it)
          if (board.timerRunning()) {
            timer.remaining = board.timerLeft();
            console.log('timer left');
            console.log(board.timerLeft());
            timer.start();
            // Not running
          } else {
            scope.showTimerStart = true;
            console.log('timer length');
            console.log(board.timerLength());
            timer.remaining = board.timerLength();
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