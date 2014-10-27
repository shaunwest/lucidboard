(function() {
  'use strict';

  angular.module('hansei.routes', ['ui.router']);

  angular.module('hansei.services', ['hansei.routes'])
    .config(['$stateProvider', 'appStateDefaults', 'routes',
      function($stateProvider, appStateDefaults, routes) {
        angular.forEach(routes, function(stateConfig, key) {
          var config = angular.extend(angular.copy(appStateDefaults), stateConfig);
          $stateProvider.state(key, config);
        });
      }]);

  angular.module('hansei.ui', ['hansei.services']);

  angular.module('hansei', ['hansei.ui'])
    .config(['$locationProvider', function($locationProvider) {
      $locationProvider
        .html5Mode({enabled: true, requireBase: false})
        .hashPrefix('!');
    }]);
})();