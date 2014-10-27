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

  var fail = function() {
    return res.forbidden('You are not permitted to perform this action.');
  };

  var token = req.headers['auth-token'];

  if (!token) return fail();

  if (!token.match(/^\d+$/)) return fail();

  User.findOne({id: token}, function(err, user) {
    if (err) return res.serverError(err);

    if (!user) return fail();

    req.user = user;

    next();
  });

};
