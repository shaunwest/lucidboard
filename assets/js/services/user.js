(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('user', ['$q', 'api', 'localStorageService', function($q, api, localStorageService) {

      var user = { token: localStorageService.get('authToken') },
          initialTokenDefer;

      return {
        obj:    function() { return user; },
        id:     function() { return user.id; },
        name:   function() { return user.name; },
        token:  function() { return user.token; },
        signin: function(username, pass, cb) {
          api.signin(username, pass, function(data, jwr) {
            localStorageService.set('authToken', data.token);
            initialTokenDefer.resolve();
            user = data;
            cb(data, jwr);
          });
        },
        signout: function() {
          var beganSignedIn = Boolean(this.token());
          user = { token: null };
          localStorageService.remove('authToken');
          return beganSignedIn;
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
          api.refreshToken(user.token, function(data, jwr) {
            user.token = data.token || null;
            localStorageService.set('authToken', user.token);
            user = data;
            cb(data, jwr);
          });
        },
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
