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
      adminBoards: {
        url:         '/boards/where/:type',
        templateUrl: '/templates/adminBoards.html',
        controller:  'AdminBoardsCtrl',
        resolve: {
          loadConfig: loadConfig,
          theBoards: ['$q', '$stateParams', '$state', 'api', 'user',
          function($q, $stateParams, $state, api, user) {
            var defer = $q.defer();
            if (user.signedIn) {
              switch ($stateParams.type) {
                case 'archived':
                  api.boardsGetArchivedList(function(boards) { defer.resolve(boards); });
                  break;
                case 'private':
                  api.boardsGetPrivateList(function(boards) { defer.resolve(boards); });
                  break;
                default:
                  $state.go('adminBoards', {type: 'archived'});
              }
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
          boardData: ['board', 'user', '$stateParams', '$q',
          function(board, user, $stateParams, $q) {
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
