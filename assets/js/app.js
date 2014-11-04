(function() {
  'use strict';

  angular.module('hansei.routes', ['ui.router']);

  angular.module('hansei.services', ['hansei.routes', 'ngSails'])
    .config(['$stateProvider', 'appStateDefaults', '$urlRouterProvider', 'routes',
      function($stateProvider, appStateDefaults, $urlRouterProvider, routes) {

        angular.forEach(routes, function(stateConfig, key) {
          var config = angular.extend(angular.copy(appStateDefaults), stateConfig);
          $stateProvider.state(key, config);
        });

        $urlRouterProvider.otherwise('/boards');
      }
    ])

    .run(['$sails', 'api',
      function($sails, api) {

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
