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

          var preventDefault = function($event) {
            $event.stopPropagation();
            $event.preventDefault();
          };

          scope.board          = board;
          scope.view           = view;
          scope.preventDefault = preventDefault;

          scope.timerStart = function($event) {
            var seconds = view.timer.inputInSeconds();
            preventDefault($event);
            if (seconds) api.timerStart(board.id, seconds);
            return false;
          };

          scope.timerReset = function($event) {
            api.timerPause(board.id, board.timer.startTime);
            preventDefault($event);
            return false;
          };

          scope.timerPause = function($event) {
            api.timerPause(board.id, board.timer.remaining);
            preventDefault($event);
            return false;
          };
        }
      }
    }]);
})();
