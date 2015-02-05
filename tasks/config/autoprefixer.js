/**
* Postprocess - Adds browser prefixes to CSS.
*
* ---------------------------------------------------------------
*/

var autoprefixer = require('gulp-autoprefixer');

module.exports = function(gulp, plugins, growl) {
    gulp.task('autoprefix:dev', function () {
        return gulp.src('.tmp/public/styles/style.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('.tmp/public/styles'))
        .pipe(plugins.if(growl, plugins.notify({ message: 'Autoprefixer task complete' })));
    });
};
