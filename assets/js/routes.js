(function() {
  'use strict';

  var loadConfig = ['config', function(config) {
    config.load();
    return config.promise();
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
          hideHeader: ['$rootScope', function($rootScope) {
            $rootScope.showHeader = false;
          }],
          boards: ['$q', 'api', 'user', function($q, api, user) {
            var defer = $q.defer();
            if (user.token()) {
              api.boardsGetList(function(boards) {
                defer.resolve(boards);
              });
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
          boardData: ['board', 'user', '$stateParams', function(board, user, $stateParams) {
            if (!user.token()) {
              var defer = $q.defer();
              defer.reject('not_logged_in');
              return defer.promise;
            }
            return board.load($stateParams.boardId);
          }]
        }
      }
    });
})();
