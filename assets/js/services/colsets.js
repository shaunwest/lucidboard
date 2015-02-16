(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('colsets', ['$q', 'api', function($q, api) {

      var defer = $q.defer(),
          colsets;

      return {
        load: function() {
          api.getColsets(function(_colsets) {
            colsets = _colsets;
            defer.resolve();
          });
          return defer.promise;
        },
        all: function() {
          return colsets;
        },
        promise: function() {
          return defer.promise;
        }
      };

    }])
})();
