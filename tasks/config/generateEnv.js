var fs = require('fs');

var randomString = function(length) {
  var ret = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i=0; i<length; i++) {
    ret += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return ret;
};


module.exports = function (gulp, plugins) {
  gulp.task('generateEnv', function(cb) {

    var data = 'SESSION_SECRET=' + randomString(32) + "\n" +
               'CRYPTO_KEY='     + randomString(96);

    fs.writeFile('.env', data, {mode: 0640}, cb);

  });
};
