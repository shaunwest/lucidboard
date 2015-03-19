(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('HeaderCtrl', ['$rootScope', '$scope', '$state', '$timeout', 'api', 'user', 'board', 'timer',
    function($rootScope, $scope, $state, $timeout, api, user, board, timer) {

      $scope.user          = user;
      $scope.showTimerForm = false;
      $scope.timer         = timer;

      $scope.timerStart = function(minutes) {
        $scope.clockPop = true;
        $scope.showTimerForm = false;
        api.timerStart(board.id(), minutes * 60);
        $timeout(function() { $scope.clockPop = false; }, 500);
      };

      $scope.board             = board;
      $scope.timerMinutesInput = 5;
      $scope.signout           = function(event) { $state.go('signin'); };
      $scope.current           = $state.current;

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

      $rootScope.getColumnViewState = function(columnId, columnViewSelected) {
        return (columnViewSelected.id === 0 || columnViewSelected.id === columnId);
      };

      function showBoardNav() {
        $rootScope.columnViews = $scope.board.columns({withTrash: true}).map(function(column) {
          return { label: column.title, id: column.id };
        });
        $rootScope.columnViews.unshift($rootScope.columnViewSelected = {id: 0, label: 'View All'});

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
