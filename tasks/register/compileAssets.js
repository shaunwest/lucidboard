module.exports = function (gulp, plugins) {
	gulp.task('compileAssets', function(cb) {
		plugins.sequence(
			'clean:dev',
			'jst:dev',
			'sass:dev',
			'copy:dev',
			'coffee:dev',
			cb
		);
	});
};
