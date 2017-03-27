var build = require("./build/build"),
	write = require("./write/write"),
	Q = require("q"),
	fs = require("fs-extra"),
	mkdirs = Q.denodeify(fs.mkdirs),
	buildHash = require("./build/build_hash"),
	rmdir = Q.denodeify(require('rimraf')),
	path = require('path'),
	fsx = require('./fs_extras'),
	Handlebars = require("handlebars");

/**
 * @function documentjs.generators.html.generate
 * @parent documentjs.generators.html.methods
 *
 * Generates an HTML site for a [documentjs.process.docMap docMap]
 * given configuration siteConfig.
 *
 * @signature `.generate(docMapPromise, siteConfig)`
 *
 * @param {Promise<documentjs.process.docMap>} docMapPromise A promise that
 * contains a `docMap` created by [documentjs.process.files].
 * @param {Object} siteConfig Configuration siteConfig.
 *
 * @return {Promise} A promise that resolves when the site has been built.
 */
module.exports = function(docMapPromise, siteConfig){
	// 1. Copies everything from site/default/static to site/static/build
	// 2. Overwrites site/static/build with content in `siteConfig.static`
	// 3. Runs site/static/build/build.js
	//    A. Builds itself and copies everything to site/static/dist
	var staticPromise = build.staticDist(siteConfig).then(function(){
		console.log( 'staticPromise: COPIES statics' );
		// copies statics to documentation location.
		return write.staticDist(siteConfig);
	});

	debugger;

	console.log( 'GONNA DO template promise' );

	var buildTemplatesPromise = build.templates(siteConfig).then(function(){

		console.log( 'DOING template promise' );

		debugger;

		return Handlebars.create();
	});

	debugger;

	buildTemplatesPromise["catch"](function(){

		debugger;

		console.log("problem building templates");
	});

	console.log( 'DID template promise' );

	var currentDocObject;
	var getCurrent = function(){
		return currentDocObject;
	};
	var setCurrent = function(current){
		currentDocObject = current;
	};
	var helpersReadyPromise = docMapPromise.then(function(docMap){
		debugger;
		return build.helpers(buildTemplatesPromise, docMap, siteConfig, getCurrent);
	});
	var searchMapPromise = docMapPromise.then(function(docMap){
		return write.searchMap(docMap, siteConfig);
	});

	debugger;

	var docsPromise = Q.all([
			docMapPromise,
			build.renderer(buildTemplatesPromise, siteConfig),
			helpersReadyPromise,
			mkdirs(siteConfig.dest),
			searchMapPromise
	]).then(function(results){
		console.log( 'docsPromise: WRITE docMAP' );
		var docMap = results[0],
			renderer = results[1];
		return write.docMap(docMap, renderer, siteConfig, setCurrent);
	});

	return Q.all([staticPromise, docsPromise]).catch(function(err){
		return Q.Promise(function(resolve,reject){
			Q.fcall(function(){
				var hash = buildHash(siteConfig);
				// following fsx.exists is a temporary sanity check around rimraf...
				return fsx.exists(path.join("site","templates",hash)).then(function(exists){
					if(exists) {
						return rmdir(path.join(__dirname,"site","*",hash)).then(function(){
							console.log('DID REMOVE');
						}, function(rmerr) {
							throw rmerr;
						});
					} else {
						console.log ( 'DOES NOT EXIST' );
					}
				}, function(exerr){
					throw exerr;
				});
			}).then(function(){
				reject(err);
			}, function(err2){
				reject({ originalError: err, cleanupError: err2 });
			});
		});
	});
};
