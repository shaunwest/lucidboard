// Manage a set of server events
(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('eventerFactory', ['api', function(api) {
      return function(events) {  // {event: callback, ...}
        events = events || {};
        return {
          getEvents: function() {
            return Object.keys(events);
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

            _eventer.register(scope);
            scope.$on('$destroy', function() { _eventer.unregister(); });
          },
          register: function(scope) {
            if (typeof events === 'function') {
              events = events();
            }

            api.subscribe(this.getEvents());

            // This hooks the actual code to the future inbound message. When the
            // scope $destroys, the event is automatically unhooked.
            for (var ev in events) { api.hook(ev, scope, events[ev]); }

            return this;
          },
          unregister: function() {
            api.unsubscribe(this.getEvents());

            return this;
          },
        };
      };
    }])
})();

