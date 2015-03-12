(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('HeaderCtrl', ['$rootScope', '$scope', '$state', '$timeout', 'api', 'board', 'timer',
    function($rootScope, $scope, $state, $timeout, api, board, timer) {

      $scope.showTimerForm = false;
      $scope.timer         = timer;

      $scope.timerStart = function(minutes) {
        $scope.showTimerForm = false;
        api.timerStart(board.id(), minutes * 60);
      };

      $scope.board = board;

      function showBoardNav() {
        $scope.timerMinutesInput = 5;
        $scope.timerLeft         = timer.remaining;
        $scope.showBoardNav      = true;

        $rootScope.currentTab   = 'board';
        $rootScope.switchTab    = function(tabName) { $rootScope.currentTab = tabName; };
        $rootScope.cardDragging = false;

        $rootScope.$on('ANGULAR_DRAG_START', function(event, channel, card) {
          $rootScope.cardDragging = true;
        });

        $rootScope.$on('ANGULAR_DRAG_END', function(event, channel, card) {
          $rootScope.cardDragging = false;
        });

        if (board.timerLeft() > 0) {
          timer.start(board.timerLeft());
        }
      }

      if ($state.current.name === 'board') {
        showBoardNav();
      }

      $rootScope.$on('$stateChangeSuccess', function(event, toState) {
        if (toState.name === 'board') {
          showBoardNav();
        } else {
          $scope.showBoardNav = false;
        }
      });
    }]);
})();
