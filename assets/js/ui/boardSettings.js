(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('boardSettings', ['board', function(board) {
      return {
        restrict: 'E',
        templateUrl: '/templates/_boardSettings.html',
        controller: ['$scope', '$state', 'api', 'view', 'config',
        function($scope, $state, api, view, config) {

          $scope.board   = board;
          $scope.colsets = config.colsets;

          if (board.loaded) {
            // Without this, modifying the form has a direct affect on the real
            // board model. We only want to allow changing this when the event comes
            // back from the server after the real, server-side update.
            $scope.b = angular.copy($scope.board);
            $scope.$watch('board', function() { $scope.b = angular.copy(board); });
          } else {
            $scope.b = {
              id:             null,
              title:          '',
              colsetId:       '1',
              votesPerUser:   '0',
              p_seeVotes:     true,
              p_seeContent:   true,
              p_lock:         false,
              archived:       false,
              private:        false
            };
          }

          $scope.submit = function(data) {

            if (!$scope.b.title) return alert('You must enter a title.');
            if (!String($scope.b.votesPerUser).match(/^(\d+|-1)$/)) return alert('Invalid max votes.');

            var bits = {
              title:          $scope.b.title,
              colsetId:       $scope.b.colsetId,
              votesPerUser:   $scope.b.votesPerUser,
              p_seeVotes:     !!$scope.b.p_seeVotes,
              p_seeContent:   !!$scope.b.p_seeContent,
              p_lock:         !!$scope.b.p_lock,
              archived:       !!$scope.b.archived,
              private:        !!$scope.b.private
            };

            if (board.loaded) {
              api.boardUpdate(board.id, bits, function(board) {
                view.tab.switch('board');
              });
            } else {
              api.boardCreate(bits, function(board) {
                $state.go('board', {boardId: board.id});
              });
            }

          };

        }],
      };
    }])

})();
