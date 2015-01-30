/**
* Postprocess - Adds browser prefixes to CSS.
*
* ---------------------------------------------------------------
*/

var autoprefixer = require('gulp-autoprefixer');

module.exports = function(gulp, plugins, growl) {
    gulp.task('default', function () {
        return gulp.src('.tmp/public/concat/production.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('dist'))
        .pipe(plugins.if(growl, plugins.notify({ message: 'Autoprefixer task complete' })));
    });
};
