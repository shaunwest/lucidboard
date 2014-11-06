(function() {
  'use strict';
  angular.module('hansei.routes')
    .constant('routes', {
      signin: {
        url:         '/signin',
        templateUrl: '/templates/signin.html',
        controller:  'SigninCtrl'
      },
      boards: {
        url:         '/boards',
        templateUrl: '/templates/home.html',
        controller:  'BoardsCtrl',
        resolve: {
          boards: ['$q', 'api', 'user', function($q, api, user) {
            var defer = $q.defer();
            if (user.token()) {
              api.boardsGetList(function(boards) { defer.resolve(boards); });
            } else {
              defer.resolve([]);
            }
            return defer.promise;
          }]
        }
      },
      board: {
        url:         '/boards/:boardId',
        templateUrl: '/templates/board.html',
        controller:  'BoardCtrl',
        resolve: {
          board: ['$q', '$stateParams', 'api', function($q, $stateParams, api) {
            var defer = $q.defer(), boardId = $stateParams.boardId;
            api.boardGet(boardId, function(board) { defer.resolve(board); });
            return defer.promise;
          }]
        }
      }
    });
})();
