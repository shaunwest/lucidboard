(function() {
  'use strict';

  // ROUTING
  angular.module('hansei.routes', [
      'ui.router',
      'LocalStorageModule'
    ])
    .config([
      '$stateProvider',
      'routeDefaults',
      '$urlRouterProvider',
      'routes',
      'localStorageServiceProvider',
      function($stateProvider,
               routeDefaults,
               $urlRouterProvider,
               routes,
               localStorageServiceProvider) {

        localStorageServiceProvider.setPrefix('niftyboard');

        angular.forEach(routes, function(stateConfig, key) {
          $stateProvider
            .state(key, angular.extend(angular.copy(routeDefaults), stateConfig));
        });

        $urlRouterProvider.otherwise('/signin');
      }
    ])
    .run(['$rootScope', '$state', '$location', function($rootScope, $state, $location) {
      // Monitor state change errors and route accordingly
      $rootScope.$on('$stateChangeError', function(a, b, c, d, e, rejection) {
        switch(rejection) {
          case 'not_logged_in':
            $rootScope.goto = $location.path();
            $state.go('signin');
            break;
        }
      });

      // Useful variables can be set in each route. Put them on $rootScope
      // so they can be accessed in templates.
      $rootScope.$on('$stateChangeSuccess', function(event, toState) {
        $rootScope.headerUrl = toState.headerUrl;
        $rootScope.footerUrl = toState.footerUrl;
      });
    }]);


  // SERVICES
  angular.module('hansei.services', [
      'hansei.routes',
      'ngSails',
      'angular-lodash/utils/pluck',
      'angular-lodash/utils/flatten',
      'angular-lodash/utils/sortBy',
      'angular-lodash/utils/findIndex',
    ])

    .run(['$rootScope', '$sails', '$state', 'user', 'api', 'board',
      function($rootScope, $sails, $state, user, api, board) {

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

        $sails.on('reconnect', function() {
          initialSetup();

          api.resubscribe();  // resubscribe to websocket events

          // Re-lock all our locked cards
          board.getLockedCardIds().forEach(function(cardId) {
            api.cardLock(board.id(), cardId);
          });
        });

        initialSetup();
      }
    ]);


  // USER INTERFACE
  angular.module('hansei.ui', [
      'hansei.services',
      'xeditable',
      'ang-drag-drop',
      'monospaced.elastic'
    ])

    .run(['editableOptions', 'editableThemes', function(editableOptions, editableThemes) {
      editableThemes['bs3'].inputClass = 'msd-elastic';
      editableOptions.theme = 'bs3';
    }])


  // APP
  angular.module('hansei', ['hansei.ui'])
    .config(['$locationProvider', function($locationProvider) {
      $locationProvider
        .html5Mode({enabled: true, requireBase: false})
        .hashPrefix('!');
    }]);
})();
