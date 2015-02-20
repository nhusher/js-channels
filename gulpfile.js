/*jshint node:true */

var gulp = require('gulp');
var util = require('gulp-util');
var watchify = require('watchify');
var reactify = require('reactify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var _6to5ify = require('6to5ify');

gulp.task('browser-sync', function () {
  browserSync({
    server: {
      baseDir: "./"
    }
  });
});

gulp.task('watch', function () {
  var bundler = watchify(browserify(['./src/test.js'], watchify.args).transform(_6to5ify))
      .on('update', function () { util.log('Rebundling...'); })
      .on('time', function (time) {
        util.log('Rebundled in:', util.colors.cyan(time + 'ms'));
      });

  bundler.transform(reactify);
  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
        .on('error', function (err) {
          util.log(err);
        })
        .pipe(source('channels.js'))
        .pipe(gulp.dest('./dist'));
  }

  return rebundle();
});

gulp.task('build', function () {
  var bundler = watchify(browserify(['./src/test.js'], watchify.args).transform(_6to5ify))
      .on('update', function () { util.log('Rebundling...'); })
      .on('time', function (time) {
        util.log('Rebundled in:', util.colors.cyan(time + 'ms'));
      });

  bundler.transform(reactify);
  bundler.on('update', rebundle);

  function rebundle() {
    return bundler.bundle()
        .on('error', function (err) {
          util.log(err);
        })
        .pipe(source('channels.js'))
        .pipe(gulp.dest('./dist'));
  }

  return rebundle();
});

gulp.task('default', ['watch' ]);