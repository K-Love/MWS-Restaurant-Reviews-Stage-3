const gulp = require("gulp");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const browserSync = require("browser-sync").create();
  
gulp.task("default", ["styles"], function(done) {
    gulp.watch("sass/**/*.scss", ["styles"]);
  
    browserSync.init({
      server: "./"
    });
    done();
});
  
gulp.task("styles", function() {
    gulp
      .src("sass/**/*.scss")
      .pipe(sass().on("error", sass.logError))
      .pipe(
        autoprefixer({
          browsers: ["last 2 versions"]
        })
      )
      .pipe(gulp.dest("./css"))
      .pipe(browserSync.stream());
  });

  // Build and serve the app
gulp.task('serve:dist', ['default'], function () {
  browserSync.init({
    server: 'dist',
    port: 8000
  });
});