/*jshint node:true */

var babelify = require('babelify');
var browserify = require('browserify');
var gulp = require('gulp');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var through2 = require('through2');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');

var browserified = function() {
  return through2.obj(function (file, enc, next) {
    return browserify({ entries: file.path, debug: true })
        .transform(babelify)
        .bundle(function(err, res) {
          file.contents = res;
          next(null, file);
        });
  });
}

gulp.task('browser', function () {
  return gulp.src('src/index.browser.js')
    .pipe(browserified())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(rename('channels.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/browser'));
});

gulp.task('browser-min', function () {
  return gulp.src('src/index.browser.js')
      .pipe(browserified())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .pipe(rename('channels.min.js'))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('dist/browser'));
});


gulp.task('test', function() {
  return gulp.src('test/test.js')
    .pipe(browserified())
    .pipe(gulp.dest('dist/tests'));

});


gulp.task('default', [ 'browser', 'browser-min' ]);