var subscriber = require('../services/subscriber');

module.exports = {

  signin: function(req, res) {
    var username = req.body.username,
        password = req.body.password;

    var finish = function(user) {
      res.jsonx({
        // id:       user.id,
        // username: user.name,
        token:    user.id  // FIXME: temporary
      });
    };

    // TODO: Make this actually a thing. We aren't even password checking.
    User.findOne({name: username}, function(err, user) {
      if (err) return res.serverError(err);

      if (user) {
        finish(user);

      } else {  // Create the user if it doesn't exist
        User.create({
          name: username,
          password: password
        }, function(err, user) {
          if (err) return res.serverError(err);

          console.log('User created: ', user);

          finish(user);
        });
      }
    });

  },

  /**
   * Method browsers use to subscribe to redis events
   */
  subscribe: function(req, res) {
    if (!req.param('events') || !req.param('events').length) {
      return res.badRequest('Events parameter missing or invalid.');
    }
    subscriber.subscribe(req, req.param('events'), function(err) {
      if (err) res.serverError(err);
      res.json({subs: subscriber.getSubs(req)});
    });
  },

  /**
   * Method browsers use to unsubscribe from redis events
   */
  unsubscribe: function(req, res) {
    if (!req.param('events') || !req.param('events').length) {
      return res.badRequest('Events parameter missing or invalid.');
    }
    subscriber.unsubscribe(req, req.param('events'), function(err) {
      if (err) res.serverError(err);
      res.json({subs: subscriber.getSubs(req)});
    });
  },

};
