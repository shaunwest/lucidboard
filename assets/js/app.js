(function() {
  'use strict';

  angular.module('hansei.routes', ['ui.router']);

  angular.module('hansei.services', ['hansei.routes', 'ngSails', 'LocalStorageModule'])
    .config(['$stateProvider', 'appStateDefaults', '$urlRouterProvider', 'routes', 'localStorageServiceProvider',
      function($stateProvider, appStateDefaults, $urlRouterProvider, routes, localStorageServiceProvider) {

        localStorageServiceProvider.setPrefix('niftyboard');

        angular.forEach(routes, function(stateConfig, key) {
          var config = angular.extend(angular.copy(appStateDefaults), stateConfig);
          $stateProvider.state(key, config);
        });

        $urlRouterProvider.otherwise('/boards');
      }
    ])

    .run(['$sails', '$state', 'api', 'localStorageService',
      function($sails, $state, api, localStorageService) {
        console.log('HAI RUN');

        var refreshToken = function(resubscribe) {
          var token = localStorageService.get('authToken');

          if (!token) {
            console.log('sending to signin');
            return $state.go('signin');
          }

          console.log('logging in with ', token);
          api.signinWithToken(token, function(data) {
            // We'll get a new, refreshed token back
            localStorageService.set('authToken', data.token);
            console.log('GOT', data.token);
            if (resubscribe) api.resubscribe();
          });
        };

        $sails.on('connect', function() {
          console.log('conn');
          refreshToken();
        });

        $sails.on('reconnect', function() {
          refreshToken(true);
        });
      }
    ]);

  angular.module('hansei.ui', ['hansei.services']);

  angular.module('hansei', ['hansei.ui'])
    .config(['$locationProvider', function($locationProvider) {
      $locationProvider
        .html5Mode({enabled: true, requireBase: false})
        .hashPrefix('!');
    }]);
})();
