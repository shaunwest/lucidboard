(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('config', ['$q', 'api', function($q, api) {

      var calling = false,
          defer   = $q.defer();

      return {
        loaded:  false,
        promise: function() { return defer.promise; },
        load:    function(force) {
          if ((force || !this.loaded) && !calling) {

            defer   = $q.defer();
            calling = true;

            api.getConfig(function(config) {

              Object.keys(config).forEach(function(name) {
                if (name === 'regex') {
                  this.regex = {};
                  Object.keys(config.regex).forEach(function(name) {
                    this.regex[name] = new RegExp(config.regex[name]);
                  }.bind(this));
                } else {
                  this[name] = config[name];
                }
              }.bind(this));

              calling     = false;
              this.loaded = true;

              defer.resolve();

            }.bind(this));
          }
          return defer.promise;
        }
      };

    }])
})();
