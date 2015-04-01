(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('user', ['$q', 'api', 'localStorageService', function($q, api, localStorageService) {

      var fetchLSToken = function() {
        return localStorageService.get('authToken');
      };

      var user, initialTokenDefer, initialToken = fetchLSToken();

      user = {
        signedIn: Boolean(initialToken),

        refresh: function(data) {
          this.id       = data ? data.id : null;
          this.name     = data ? data.name : null;
          this.token    = data ? data.token : fetchLSToken();
          this.admin    = data ? data.admin : false;
          this.signedIn = Boolean(data ? data.token : fetchLSToken());
        },
        signin: function(username, pass, cb) {
          api.signin(username, pass, function(data, jwr) {
            localStorageService.set('authToken', data.token);
            initialTokenDefer.resolve();
            this.refresh(data);
            cb(data, jwr);
          }.bind(this));
        },
        signout: function() {
          var beganSignedIn = Boolean(this.token);
          localStorageService.remove('authToken');
          localStorageService.set('justSignedOut', true);
          this.refresh();
          return beganSignedIn;
        },
        clearJustSignedOut: function() {
          var ret = localStorageService.get('justSignedOut');
          localStorageService.remove('justSignedOut');
          return Boolean(ret);
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
          api.refreshToken(this.token, function(data, jwr) {
            this.token = data.token || null;
            localStorageService.set('authToken', this.token);
            this.refresh(data);
            cb(data, jwr);
          }.bind(this), true);
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

      user.refresh();  // initialize

      return user;
    }])
})();
