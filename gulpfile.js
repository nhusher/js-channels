/*jshint node:true */

var babelify = require('babelify');
var babel = require('gulp-babel');
var browserify = require('browserify');
var concat = require('gulp-concat');
var gulp = require('gulp');
var merge = require('gulp-merge');
var ngAnnotate = require('gulp-ng-annotate');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var through2 = require('through2');
var uglify = require('gulp-uglify');

var browserified = function() {
  return through2.obj(function (file, enc, next) {
    return browserify({ entries: file.path, debug: true })
        .transform(babelify)
        .bundle(function(err, res) {
          if(err) {
            throw err;
          }

          file.contents = res;
          next(null, file);
        });
  });
};

gulp.task('clean', function() {
  return gulp.src('dist', { read: false }).pipe(require('gulp-clean')());
});

gulp.task('angular', [ 'clean' ], function() {
  var tx = gulp.src([ 'src/channels/*.js', 'src/angular/promise.js', '!src/channels/index*', '!src/channels/promise.js' ])
      .pipe(sourcemaps.init({ debug: true }))
      .pipe(babel({ modules: require('./util/angular-module-formatter.js') }));

  return merge(
          gulp.src('src/angular/index.js').pipe(sourcemaps.init({ debug: true })),
          tx)
      .pipe(ngAnnotate())
      .pipe(concat('js-channels.js'))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('dist/angular'));

});

gulp.task('angular-min', [ 'clean' ], function() {
  var tx = gulp.src([ 'src/channels/*.js', 'src/angular/promise.js', '!src/channels/index*', '!src/channels/promise.js' ])
      .pipe(sourcemaps.init({ debug: true }))
      .pipe(babel({ modules: require('./util/angular-module-formatter.js') }));

  return merge(
          gulp.src('src/angular/index.js').pipe(sourcemaps.init({ debug: true })),
          tx)
      .pipe(ngAnnotate())
      .pipe(concat('js-channels.min.js'))
      .pipe(uglify())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('dist/angular'));

});

gulp.task('node', [ 'clean' ], function() {
  return gulp.src('src/channels/*.js')
      .pipe(sourcemaps.init())
      .pipe(babel())
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('dist/node'));
});

gulp.task('test', [ 'clean' ], function() {
  return gulp.src('test/test.js')
    .pipe(browserified())
    .pipe(gulp.dest('dist/tests'));
});

// TODO: browser module
gulp.task('default', [ 'node', 'angular', 'angular-min', 'test' ]);