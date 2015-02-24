/**
 * authenticated
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

  var token;

  var fail = function() {
    res.forbidden('You are not permitted to perform this action.');
  };

  if (req.isSocket) {
    req.user = req.socket.user;

    if (req.user) return next();

    token = req.socket.authToken;
    console.log('token-socket', token);

    if (!req.socket || !req.socket.redis) {
      redis.socketOnConnection(req.session, req.socket);
    }

  } else {
    token = req.headers['auth-token'];
    console.log('token-regular', token);
  }

  User.findByToken(token, function(err, user) {
    if (err) return res.serverError(err);

    if (!user) return fail();

    req.user        = user;
    req.socket.user = user;

    next();
  });

};
