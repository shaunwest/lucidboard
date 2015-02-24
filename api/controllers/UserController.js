var ldap       = require('../services/ldap'),
    subscriber = require('../services/subscriber'),
    config     = sails.config.app;

module.exports = {
  signin: function(req, res) {
    var username = (req.body.username || '').trim(),
        password = (req.body.password || '').trim();

    var badLoginJson = {
      status:  'error',
      code:    'badlogin',
      message: 'Invalid username or password.'
    };

    var finish = function(user) {
      var token = user.buildToken();

      if (req.isSocket) {
        req.socket.authToken = token;
      }

      res.jsonx({
        username: user.name,
        email:    user.email,
        token:    user.buildToken()
      });
    };

    switch (config.signin) {
      case 'dumb':

        if (!username) return res.forbidden(badLoginJson);

        User.findOne({name: username}, function(err, user) {
          if (err) return res.serverError(err);

          if (user) return finish(user);

          // Create the user if it doesn't exist
          User.create({name: username, email: 'dumb-' + username + '@example.com'}, function(err, user) {
            if (err) return res.serverError(err);

            finish(user);
          });
        });
        break;

      case 'ldap':

        if (!username || !password) return res.forbidden(badLoginJson);

        ldap.login(username, password, function(err, data) {
          if (err)   return res.serverError(err);
          if (!data) return res.forbidden(badLoginJson);

          User.findOne({name: data.username}, function(err, user) {
            if (err)  return res.serverError(err);
            if (user) return finish(user);

            User.create({name: data.username, email: data.email}, function(err, user) {
              if (err) return res.serverError(err);

              finish(user);
            });
          });
        });
        break;

      default:

        throw 'Invalid signin setting in app configuration.';

    }

  },

  // Allow a client to reauthenticate with a token.
  // What comes out is a refreshed token.
  // This is necessary when (re)establishing the websocket.
  refreshToken: function(req, res) {
    var token = req.body.token;

    User.findByToken(token, function(err, user) {
      if (err) return res.serverError(err);

      if (!user) return res.forbidden('Invalid auth token');

      if (req.isSocket) {
        req.socket.authToken = token;
      }

      user.token = user.id;

      res.jsonx(user);
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
