module.exports = {
  login: function(req, res) {
    var username = req.body.username;

    res.send(200, {
      username: username,
      token: 'watever'
    });
  }
};
