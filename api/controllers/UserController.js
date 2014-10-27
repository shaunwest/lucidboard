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

  }
};
