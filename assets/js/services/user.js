(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('user', ['$q', 'api', 'localStorageService', function($q, api, localStorageService) {

      var token = localStorageService.get('authToken'),
          initialTokenDefer;

      return {
        signin: function(user, pass, cb) {
          api.signin(user, pass, function(data, jwr) {
            token = data.token;
            localStorageService.set('authToken', token);
            initialTokenDefer.resolve();
            cb(data, jwr);
          });
        },
        initialRefreshToken: function() {
          // When the websocket is reestablished, this method must first be
          // used to refresh the token so that the websocket session is
          // authenticated. All other API calls must wait for this to finish.
          this.refreshToken(function(data, jwr) {
            initialTokenDefer.resolve();
          });
          return initialTokenDefer.promise;
        },
        refreshToken: function(cb) {
          api.refreshToken(token, function(data, jwr) {
            token = data.token || null;
            localStorageService.set('authToken', token);
            cb(data, jwr);
          });
        },
        token: function() { return token; },
        initialTokenPromise: function() {
          return initialTokenDefer.promise;
        },
        resetInitialTokenPromise: function() {
          initialTokenDefer = $q.defer();
          api.setInitialTokenPromise(initialTokenDefer.promise);
          return initialTokenDefer.promise;
        },
      };

    }])
})();
