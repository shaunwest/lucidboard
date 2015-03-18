(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('HeaderCtrl', ['$rootScope', '$scope', '$state', '$timeout', 'api', 'user', 'board', 'timer',
    function($rootScope, $scope, $state, $timeout, api, user, board, timer) {
      $scope.user          = user;
      $scope.showTimerForm = false;
      $scope.timer         = timer;
      $scope.menuState     = '';

      $scope.toggleMenu = function() {
        $scope.menuState = ($scope.menuState === 'open') ? 'close' : 'open';
        //$scope.menuVisible = !$scope.menuVisible;
      };

      $scope.timerStart = function(minutes) {
        $scope.showTimerForm = false;
        api.timerStart(board.id(), minutes * 60);
      };

      $scope.board             = board;
      $scope.timerMinutesInput = 5;
      $scope.signout           = function(event) { $state.go('signin'); };
      $scope.current           = $state.current;

      $scope.goFullScreen = function() {
        var element = document.documentElement;
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen();
        }
      }

      function showBoardNav() {
        $scope.showBoardNav = true;
        $scope.timerLeft    = timer.remaining;

        if (board.timerLeft() > 0) {
          timer.start(board.timerLeft());
        }
      }

      if ($state.current.name === 'board') {
        showBoardNav();
      }

      $rootScope.$on('$stateChangeSuccess', function(event, toState) {
        $scope.current = toState;
        if (toState.name === 'board') {
          showBoardNav();
        } else {
          $scope.showBoardNav = false;
        }
      });

      $rootScope.currentTab   = 'board';
      $rootScope.switchTab    = function(tabName) { $rootScope.currentTab = tabName; };
      $rootScope.cardDragging = false;

      $rootScope.$on('ANGULAR_DRAG_START', function(event, channel, card) {
        $rootScope.cardDragging = true;
      });

      $rootScope.$on('ANGULAR_DRAG_END', function(event, channel, card) {
        $rootScope.cardDragging = false;
      });
    }]);
})();
