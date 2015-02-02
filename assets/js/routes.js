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
          hideHeader: ['$rootScope', function($rootScope) {
            $rootScope.showHeader = false;
          }],
          // colsets: ['$q', 'api', function($q, api) {
          //   var defer = $q.defer();
          //   api.getColsets(function(colsets) {
          //     defer.resolve(colsets);
          //   });
          //   return defer.promise;
          // }],
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
          boardData: ['board', 'user', '$stateParams', function(board, user, $stateParams) {
            if (!user.token()) {
              var defer = $q.defer();
              defer.reject('not_logged_in');
              return defer.promise;
            }
            return board.load($stateParams.boardId);
          }]
        }
      },
      home: {
        url:         '/',
        templateUrl: '/templates/splash.html',
        headerUrl: '',
        footerUrl: '',
        resolve: {
          skipSplash: ['$q', 'user', function($q, user) {
            var defer = $q.defer();

            if(user.token()) {
              defer.reject('skip_splash');
            } else {
              defer.resolve();
            }

            return defer.promise;
          }]
        }
      }
    });
})();
