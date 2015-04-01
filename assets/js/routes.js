(function() {
  'use strict';

  var loadConfig = ['config', function(config) {
    return config.load();
  }];

  var authenticate = ['user', function(user) {
    return user.initialTokenPromise();
  }];

  angular.module('hansei.routes')
    .constant('routes', {
      signin: {
        url:         '/signin',
        templateUrl: '/templates/signin.html',
        controller:  'SigninCtrl',
        resolve: {
          loadConfig: loadConfig,
        }
      },
      boards: {
        url:         '/boards',
        templateUrl: '/templates/boards.html',
        controller:  'BoardsCtrl',
        resolve: {
          loadConfig: loadConfig,
          boards: ['$q', 'api', 'user', function($q, api, user) {
            var defer = $q.defer();
            if (user.signedIn) {
              api.boardsGetUnarchivedList(function(boards) { defer.resolve(boards); });
            } else {
              defer.reject('not_logged_in');
            }
            return defer.promise;
          }]
        }
      },
      archivedBoards: {
        url:         '/archived-boards',
        templateUrl: '/templates/archivedBoards.html',
        controller:  'ArchivedBoardsCtrl',
        resolve: {
          loadConfig: loadConfig,
          theArchivedBoards: ['$q', 'api', 'user', function($q, api, user) {
            var defer = $q.defer();
            if (user.signedIn) {
              api.boardsGetArchivedList(function(boards) { defer.resolve(boards); });
            } else {
              defer.reject('not_logged_in');
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
          loadConfig: loadConfig,
          boardData: ['board', 'user', '$stateParams', '$q', function(board, user, $stateParams, $q) {
            if (!user.signedIn) {
              var defer = $q.defer();
              defer.reject('not_logged_in');
              return defer.promise;
            }
            return board.load($stateParams.boardId);
          }]
        }
      },
      adminDelegation: {
        url:         '/admin-delegation',
        templateUrl: '/templates/adminDelegation.html',
        controller:  'AdminDelegationCtrl'
      }
    });
})();
