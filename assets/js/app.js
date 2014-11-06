(function() {
  'use strict';

  angular.module('hansei.routes', ['ui.router']);

  angular.module('hansei.services', ['hansei.routes', 'ngSails', 'LocalStorageModule'])
    .config(['$stateProvider', 'appStateDefaults', '$urlRouterProvider', 'routes', 'localStorageServiceProvider',
      function($stateProvider, appStateDefaults, $urlRouterProvider, routes, localStorageServiceProvider) {

        localStorageServiceProvider.setPrefix('niftyboard');

        angular.forEach(routes, function(stateConfig, key) {
          $stateProvider.state(key,
            angular.extend(angular.copy(appStateDefaults), stateConfig));
        });

        $urlRouterProvider.otherwise('/boards');
      }
    ])

    .run(['$rootScope', '$sails', '$state', 'user', 'api',
      function($rootScope, $sails, $state, user, api) {

        // This clues the api library into the status of the initial token setup
        // so that it can defer any calls until after the websocket session is
        // authenticated.
        api.setInitialTokenPromise(user.initialTokenPromise());

        if (!user.token()) {
          $rootScope.$on('$stateChangeSuccess', function(event, next) {
            return $state.go('signin');
          });
          return;
        }

        // We have a token in local storage, so let's reauthenticate with it for
        // this fresh websocket connection.
        user.initialRefreshToken();

        $sails.on('reconnect', function() {
          api.resubscribe();
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
