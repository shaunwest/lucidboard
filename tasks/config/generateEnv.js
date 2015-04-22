var fs           = require('fs'),
    randomString = require('../../api/services/util').randomString;

module.exports = function (gulp, plugins) {
  gulp.task('generateEnv', function(cb) {

    var data = 'SESSION_SECRET=' + randomString(32) + "\n" +
               'CRYPTO_KEY='     + randomString(96);

    fs.writeFile('.env', data, {mode: 0640}, cb);

  });
};
