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

        localStorageServiceProvider.setPrefix('lucidboard');

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
          case 'board_not_found':
            alert("Sorry, that board doesn't seem to exist.");
            $state.go('boards');
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
      'angular-lodash/utils/map',
      'angular-lodash/utils/find',
      'angular-lodash/utils/pluck',
      'angular-lodash/utils/flatten',
      'angular-lodash/utils/sortBy',
      'angular-lodash/utils/findIndex',
    ])

    .run(['$rootScope', '$sails', '$state', '$window', 'user', 'api', 'board', 'view', 'config',
      function($rootScope, $sails, $state, $window, user, api, board, view, config) {

        function initialSetup() {
          // This clues the api library into the status of the initial token setup
          // so that it can defer any calls until after the websocket session is
          // authenticated.
          user.resetInitialTokenPromise();

          if (!user.signedIn) return;

          // We have a token in local storage, so let's reauthenticate with it for
          // this fresh websocket connection.
          user.initialRefreshToken();
        }

        function reloadPageIfNewClientSideUpdatesExist() {
          var oldUIVersion = config.uiversion;
          var reloadInASec = function() {
            // Wait a sec to make sure the server is fully initialized
            setTimeout(function() { $window.location.reload(); }, 2500);
          };

          config.load(true).then(function() {
            if (config.uiversion === oldUIVersion) {
              view.message.reconnecting.show = false;
            } else {
              reloadInASec();
            }
          }, reloadInASec);  // just reload if config fetch fails for any reason
        }

        $sails.on('disconnect', function() {
          view.message.reconnecting.show = true;
        });

        $sails.on('reconnect', function() {
          initialSetup();

          api.resubscribe();  // resubscribe to websocket events

          // Re-lock all our locked cards
          board.locks.forEach(function(cardId) { api.cardLock(board.id, cardId); });

          reloadPageIfNewClientSideUpdatesExist();
        });

        $rootScope.bodyClick = function() {
          view.closeMenus();
        };

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
