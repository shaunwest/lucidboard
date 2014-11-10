/**
 * Compiles Sass files into CSS.
 *
 * ---------------------------------------------------------------
 */

var sass = require('gulp-sass');

module.exports = function(gulp, plugins, growl) {
	gulp.task('sass:dev', function() {
		return gulp.src('assets/styles/style.scss')
				.pipe(sass())
				.pipe(gulp.dest('.tmp/public/styles'))
				.pipe(plugins.if(growl, plugins.notify({ message: 'sass dev task complete' })));
	});
};


