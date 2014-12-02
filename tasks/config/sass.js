/**
 * Compiles Sass files into CSS.
 *
 * ---------------------------------------------------------------
 */


var sass = require('gulp-ruby-sass');

module.exports = function(gulp, plugins, growl) {
  gulp.task('sass:dev', function() {
    return sass('assets/scss/style.scss', {loadPath: 'assets/bower_components/susy/sass/'})
      .on('error', function (err) {
        console.error('Sass Error!', err.message);
      })
      .pipe(gulp.dest('.tmp/public/styles'))
      .pipe(plugins.if(growl, plugins.notify({ message: 'sass dev task complete' })));
  });
};
