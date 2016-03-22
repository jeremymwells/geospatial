var gulp = require('gulp'),
	nodemon = require('gulp-nodemon'),
	webserver = require('gulp-webserver'),
	plumber = require('gulp-plumber'),
	babel = require('gulp-babel'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	browserify = require('gulp-browserify');
	babelify = require('babelify'),
	del = require('del'),
	gulpIf = require('gulp-if'),
	watchGlob = ['server', 'client/**!(bundle*)/*'];

function transpile(inDev){
	console.log('TRANSPILING');
	gulp.src(__dirname + '/client/app.js')
		.pipe(plumber())
		.pipe(babel({
			presets:['es2015'],
			code:true
		}))
		.pipe(browserify({
			insertGlobals : true,
			transform:['babelify']
		}))
		.pipe(concat('bundle.js'))
		.pipe(gulpIf(!inDev, uglify({ 
			mangle:false 
		})))
		.pipe(rename({
			suffix:'.min'
		}))
		.pipe(gulp.dest('client'));
};

function deleteBundle(){
	console.log('DELETING BUNDLE');
	del.sync('./client/bundle*.js' );
}

gulp.task('server', function(){
	nodemon({ 
	  	script: 'server/index.js',
		watch: watchGlob
	}).on('start',function(){
		deleteBundle();
		transpile(true);
	});	
});

gulp.task('build', function(){
	deleteBundle();
	transpile();
});

gulp.task('serve', ['server']);

gulp.task('default', ['build']);

