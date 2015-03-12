/**
 * Inject svgs into the main html file
 *
 * ---------------------------------------------------------------
 *
 *
 */

function fileContents (filePath, file) {
  return file.contents.toString('utf8');
}

module.exports = function(gulp, plugins, growl) {
	gulp.task('svg:dev', function() {
		var svgs = gulp.src('./assets/images/svgs/**/*.svg')
      //.pipe(plugins.svgmin()) // doesn't support namespaces, like 'sketch'
      .pipe(plugins.svgstore({ inlineSvg: true }))
      .pipe(plugins.cheerio(function($) {
        $('svg').attr('style', 'display:none');
      }));

    return gulp.src('./views/layout.ejs')
      .pipe(plugins.inject(svgs, { transform: fileContents }))
      .pipe(gulp.dest('./views'));
	});
};
