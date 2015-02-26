(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('api', ['$sails', '$state', function($sails, $state) {

      var targetsOutsideLogin = [
        '/api/config',
        '/api/signin',
        '/api/refresh-token'
      ];

      var sanitize = function(thing) {
        if (!thing) return thing;
        if (typeof thing === 'array') {
          return thing.map(sanitize);
        } else if (typeof thing === 'object') {
          Object.keys(thing).forEach(function(k) {
            if (typeof thing[k] === 'object') thing[k] = sanitize(thing[k]);
            if (k === 'password') thing[k] = '***';
          });
          return thing;
        } else {
          return thing;
        }
      };

      var debug = function() {
        console.log.apply(console, sanitize(arguments));
      };

      var info = function() {
        console.log.apply(console, sanitize(arguments));
      };

      var subs = [];  // our currently subscribed events

      // must wait for this to finish before doing anything!
      var initialTokenPromise;

      var subscriber = {
        debug: function() {
          info('Subscriptions: ' + JSON.stringify(subs));
        },
        subscribe: function(e, cb) {
          var toSubscribe = [];
          if (typeof e === 'string') e = [e];
          for (var i in e) {
            if (subs.indexOf(e[i]) === -1) {
              toSubscribe.push(e[i]);
            }
            subs = subs.concat(e[i]);
          }
          if (!toSubscribe.length) return cb ? cb() : null;
          post('/api/subscribe', {events: toSubscribe}, cb);
        },
        unsubscribe: function(e, cb) {
          var toUnsubscribe = [];
          if (typeof e === 'string') e = [e];
          for (var i in e) {
            var idx = subs.indexOf(e[i]);
            if (idx === -1) {
              info("Subscription doesn't exist: " + e[i]);
            } else {
              subs.splice(idx, 1);
              toUnsubscribe.push(e[i]);
            }
          }
          if (!toUnsubscribe.length) return cb ? cb() : null;
          post('/api/unsubscribe', {events: toUnsubscribe}, cb);
        },
        resubscribe: function(cb) {
          if (!subs.length) return cb ? cb() : null;
          post('/api/subscribe', {events: subs}, cb);
        }
      };

      var handleResponse = function(data, jwr, cb) {
        // if (data && data.location) {
        //   $location.path(data.location);
        // }
        // if (data && data.status === 'error') {
        //   data.err = data.message;
        //   FlashService.show(data.message);
        // }
        switch (jwr.statusCode) {
          case 403: return $state.go('signin');
          case 500:
            console.log('oh noes', data, jwr);
            return alert('oh noes!');
        };

        cb(data, jwr);
      };

      var handleRequest = function(method, target, params, cb) {

        var invoke = function() {
          $sails[method](target, params, function(data, jwr) {
            info('api ' + method + ' [' + target + ']', params, '(' + jwr.statusCode + ')', data);
            handleResponse(data, jwr, function(data, jwr) {
              if (cb) cb(data, jwr);
            });
          });
        };

        if (targetsOutsideLogin.indexOf(target) !== -1) {

          // TODO: I would love to figure out why this timout helps so much...
          setTimeout(function() { invoke(); }, 100);

        } else {
          initialTokenPromise.then(function() { invoke(); });
        }

      };

      var get = function(target, cb) {
        handleRequest('get', target, {}, cb);
      };

      var post = function(target, params, cb) {
        handleRequest('post', target, params, cb);
      };

      return {
        setInitialTokenPromise: function(itp) { initialTokenPromise = itp; },
        signin: function(user, pass, cb) {
          post('/api/signin', {username: user, password: pass}, cb);
        },
        refreshToken: function(token, cb) {
          post('/api/refresh-token', {token: token}, cb);
        },

        boardsGetList: function(cb) { get('/api/boards', cb); },
        boardCreate: function(bits, cb) { post('/api/boards', bits, cb); },
        boardGet: function(boardId, cb) { get('/api/boards/' + boardId, cb); },
        boardUpdate: function(boardId, bits, cb) { post('/api/boards/' + boardId, bits, cb); },
        boardMoveCard: function(boardId, bits, cb) {
          post('/api/boards/' + boardId + '/move-card', bits, cb);
        },
        boardMovePile: function(boardId, bits, cb) {
          post('/api/boards/' + boardId + '/move-pile', bits, cb);
        },
        boardCombineCards: function(boardId, bits, cb) {
          post('/api/boards/' + boardId + '/combine-cards', bits, cb);
        },
        boardCombinePiles: function(boardId, bits, cb) {
          post('/api/boards/' + boardId + '/combine-piles', bits, cb);
        },
        boardCardFlip: function(boardId, bits, cb) {
          post('/api/boards/' + boardId + '/card-flip', bits, cb);
        },
        columnCreate: function(boardId, bits, cb) {
          post('/api/boards/' + boardId + '/columns', bits, cb);
        },
        columnUpdate: function(boardId, column, cb) {
          post('/api/boards/' + boardId + '/columns/' + column.id, column, cb);
        },
        cardCreate: function(boardId, columnId, bits, cb) {
          post('/api/boards/' + boardId + '/columns/' + columnId + '/cards',
            bits, cb);
        },
        cardUpdate: function(boardId, columnId, bits, cb) {
          post('/api/boards/' + boardId + '/columns/' + columnId + '/cards/' +
            bits.id, bits, cb);
        },
        cardUpvote: function(boardId, columnId, cardId, cb) {
          post('/api/boards/' + boardId + '/columns/' + columnId + '/cards/' +
            cardId + '/upvote', {}, cb);
        },
        timerStart: function(boardId, seconds, cb) {
          post('/api/boards/' + boardId + '/timer-start', {seconds: seconds}, cb);
        },
        getConfig: function(cb) { get('/api/config', cb); },

        subscribe:   function(events, cb) { subscriber.subscribe(events, cb); },
        unsubscribe: function(events, cb) { subscriber.unsubscribe(events, cb); },
        resubscribe: function(cb)         { subscriber.resubscribe(cb); },
        on:          function(event, fn)  { $sails.on(event, fn); },
        off:         function(event, fn)  { $sails.off(event, fn); },
        hook:        function(event, scope, fn) {
          var that = this;
          that.on(event, fn);
          scope.$on('$destroy', function() {
            that.off(event, fn);
          });
        }
      };
    }])
})();
