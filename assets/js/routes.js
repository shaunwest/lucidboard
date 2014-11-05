(function() {
  'use strict';
  angular.module('hansei.routes')
    .constant('routes', {
      signin: {
        url:         '/signin',
        templateUrl: '/templates/signin.html',
        controller:  'SigninController'
      },
      boards: {
        url:         '/boards',
        templateUrl: '/templates/home.html',
        controller:  'BoardsController',
        resolve: {
          boards: ['$q', 'api', function($q, api) {
            var defer = $q.defer();
            api.getBoards(function(boards) { defer.resolve(boards); });
            return defer.promise;
          }]
        }
      }
    });
})();
