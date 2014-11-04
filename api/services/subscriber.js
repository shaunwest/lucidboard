/**
 * Assist the browser in maintaining a set of subscribed messages
 */

var bitsFromReq = function(req) {

  if (!req.socket.subs) req.socket.subs = [];

  return {
    socket:  req.socket,
    subs:    req.socket.subs,
    redis:   req.socket.redis,
    session: req.session,
    user:    req.session.user,
  };
}

var hasPermission = function(bits, event) {
  return true;
};

module.exports = {
  subscribe: function(req, events, cb) {
    var bits = bitsFromReq(req);

    for (var i in events) {
      if (bits.subs.indexOf(events[i]) !== -1) {
        continue;
      }

      if (!hasPermission(bits, events[i])) {
        continue;
      }

      bits.redis.subscribe(events[i]);
      bits.subs.push(events[i]);
    }

    cb();
  },

  unsubscribe: function(req, events, cb) {
    var bits = bitsFromReq(req);

    for (var i in events) {
      var idx = bits.subs.indexOf(events[i]);

      if (idx === -1) {
        continue;
      }

      bits.redis.unsubscribe(events[i]);
      bits.subs.splice(idx, 1);
      i--;
    }

    cb();
  },

  getSubs: function(req) {
    return bitsFromReq(req).subs;
  },

  clear: function(req, cb) {
  },
}
