module.exports = function (gulp, plugins) {
	gulp.task('compileAssets', function(cb) {
		plugins.sequence(
			'clean:dev',
			'jst:dev',
			'sass:dev',
      'autoprefix:dev',
			'copy:dev',
			'coffee:dev',
			cb
		);
	});
};
