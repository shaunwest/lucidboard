// Manage a set of server events
(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('eventerFactory', ['api', function(api) {
      return function(events) {  // {event: callback, ...}
        events = events || {};
        return {
          getEvents: function() {
            console.log('events', Object.keys(events));
            return Object.keys(events);
            // return $.map(events, function(fn, ev) { return ev; });
          },
          event: function(ev, fn) {
            events[ev] = fn;
            return this;
          },
          events: function(objOrFn) {
            events = objOrFn;
            return this;
          },
          hook: function(scope) {
            var _eventer = this;

            _eventer.register();
            scope.$on('$destroy', function() { _eventer.unregister(); });
          },
          register: function() {
            if (typeof events === 'function') {
              events = events();
            }

            // debug('eventer registering...');
            api.subscribe(this.getEvents());
            for (var ev in events) { api.on(ev, events[ev]); }
            // $.each(events, function(ev, fn) { api.on(ev, fn); });
            return this;
          },
          unregister: function() {
            // debug('eventer unregistering.');
            api.unsubscribe(this.getEvents());
            for (var ev in events) { api.removeListener(ev, events[ev]); }
            // $.each(events, function(ev, fn) { api.removeListener(ev, fn); });
            return this;
          },
        };
      };
    }])
})();

