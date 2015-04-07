(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('HeaderCtrl', ['$rootScope', '$scope', '$state', '$timeout', '$location',
    'api', 'user', 'board', 'timer', 'view', 'config',
    function($rootScope, $scope, $state, $timeout, $location, api, user, board, timer, view, config) {

      $scope.user    = user;
      $scope.board   = board;
      $scope.view    = view;
      $scope.signout = function(event) { $state.go('signin'); };
      $scope.current = $state.current;

      $scope.signout = function(event) {
        user.signout();
        $state.go('signin');
      };

      $scope.toggleTimerForm = function() {
        view.timer.showForm = !view.timer.showForm;
        $scope.clockPop = true;
        $timeout(function() { $scope.clockPop = false; }, 500);
      };

      $scope.sortByVotes = function() {
        api.boardSortByVotes(board.id);
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
        view.column.setOptionsByBoard(board);

        $scope.$watch('board.title', function() {
          $scope.mailtoSubject = config.appname + ': ' + board.title;
          $scope.mailtoBody = user.name + ' would like to share a link to a board: ' +
            $location.protocol() + '://' + $location.host() + '/boards/' + board.id;
        });

        $scope.showBoardNav = true;
      }

      if ($state.current.name === 'board') {
        showBoardNav();
      }

      $scope.checkBoardTitle = function(title) {
        api.boardUpdate(board.id, {title: title});
        // the false returned will close the editor and not update the model.
        // (model update will happen when the event is pushed from the server)
        return false;
      };


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
