(function() {
  'use strict';

  angular.module('hansei.routes', ['ui.router']);

  angular.module('hansei.services', [
      'hansei.routes',
      'ngSails',
      'LocalStorageModule',
      'angular-lodash/utils/pluck',
      'angular-lodash/utils/flatten',
      'angular-lodash/utils/sortBy',
    ]).config(['$stateProvider',
      'appStateDefaults',
      '$urlRouterProvider',
      'routes',
      'localStorageServiceProvider',
      function($stateProvider, appStateDefaults, $urlRouterProvider, routes, localStorageServiceProvider) {

        localStorageServiceProvider.setPrefix('niftyboard');

        angular.forEach(routes, function(stateConfig, key) {
          var appState = angular.extend(angular.copy(appStateDefaults), stateConfig);
          $stateProvider.state(key, appState);
        });

        $urlRouterProvider.otherwise('/');
      }
    ])

    .run(['$rootScope', '$sails', '$state', 'user', 'api',
      function($rootScope, $sails, $state, user, api) {

        function initialSetup() {
          // This clues the api library into the status of the initial token setup
          // so that it can defer any calls until after the websocket session is
          // authenticated.
          user.resetInitialTokenPromise();

          if (!user.token()) {
            return;
          }

          // We have a token in local storage, so let's reauthenticate with it for
          // this fresh websocket connection.
          user.initialRefreshToken();
        }

        $rootScope.$on('$stateChangeError', function(a, b, c, d, e, rejection) {
          switch(rejection) {
            case 'not_logged_in':
              $state.go('signin');
              break;
            case 'skip_splash':
              $state.go('boards');
              break;
          }
        });

        // Adds special app state values to $rootScope
        $rootScope.$on('$stateChangeSuccess', function(event, toState) {
          $rootScope.headerUrl = toState.headerUrl;
          $rootScope.footerUrl = toState.footerUrl;
        });

        $sails.on('reconnect', function() {
          initialSetup();
          api.resubscribe();
        });

        initialSetup();
      }
    ]);

  angular.module('hansei.ui', [
      'hansei.services',
      'xeditable',
      'ang-drag-drop',
      'ng-context-menu'])

  .run(['editableOptions', function(editableOptions) {
    editableOptions.theme = 'bs3';
  }])

  .run(['$rootScope', '$state', 'user', function($rootScope, $state, user) {
    $rootScope.signout = function($event) {
      $event.preventDefault();
      user.signout();
      $state.go('signin');
    };

    /*if(user.token()) {
      $cookieStore.put('signedIn', true);
      $state.go('boards');
    }*/
  }]);

  angular.module('hansei', ['hansei.ui'])
    .config(['$locationProvider', function($locationProvider) {
      $locationProvider
        .html5Mode({enabled: true, requireBase: false})
        .hashPrefix('!');
    }]);
})();
