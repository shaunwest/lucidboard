(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('config', ['$q', 'api', function($q, api) {

      var defer = $q.defer(),
          config;

      return {
        load: function() {
          if (!config) {
            api.getConfig(function(_config) {
              config = _config;
              defer.resolve();
            });
          }
          return defer.promise;
        },
        all: function() {
          return config;
        },
        signin:  function() { return config.signin; },
        colsets: function() { return config.colsets; },
        promise: function() { return defer.promise; }
      };

    }])
})();
