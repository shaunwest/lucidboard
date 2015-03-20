(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('HeaderCtrl', ['$rootScope', '$scope', '$state', '$timeout', 'api',
    'user', 'board', 'timer', 'view',
    function($rootScope, $scope, $state, $timeout, api, user, board, timer, view) {

      $scope.user              = user;
      $scope.board             = board;
      $scope.timer             = timer;
      $scope.view              = view;
      $scope.showTimerForm     = false;
      $scope.timerMinutesInput = 5;
      $scope.signout           = function(event) { $state.go('signin'); };
      $scope.current           = $state.current;

      $scope.timerStart = function(minutes) {
        $scope.clockPop = true;
        $scope.showTimerForm = false;
        api.timerStart(board.id(), minutes * 60);
        $timeout(function() { $scope.clockPop = false; }, 500);
      };

      $scope.sortByVotes = function() {
        api.boardSortByVotes(board.id());
      };

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
        view.column.setOptions(board.columns({withTrash: true}).map(function(column) {
          return {id: column.id, label: column.title, position: column.position};
        }));

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

      $rootScope.$on('ANGULAR_DRAG_START', function(event, channel, card) {
        view.cardDragging = true;
      });

      $rootScope.$on('ANGULAR_DRAG_END', function(event, channel, card) {
        view.cardDragging = false;
      });
    }]);
})();
