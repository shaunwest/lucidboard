(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('boardSettings', [function() {
      return {
        restrict: 'E',
        templateUrl: '/templates/_boardSettings.html',
        scope: {
          board: '='
        },
        controller: ['$scope', '$state', 'api', 'view', 'config',
        function($scope, $state, api, view, config) {

          $scope.colsets = config.colsets;

          if ($scope.board) {
            $scope.b = $scope.board;
          } else {
            $scope.b = {
              id:             null,
              title:          '',
              colsetId:       '1',
              votesPerUser:   '0',
              p_seeVotes:     true,
              p_seeContent:   true,
              p_lock:         false,
              archived:       false
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
              archived:       !!$scope.b.archived
            };

            if ($scope.board) {
              api.boardUpdate($scope.board.id, bits, function(board) {
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
