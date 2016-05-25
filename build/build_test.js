

var getRenderer = require('./get_renderer'),
	getPartials = require('./get_partials'),
	build = require("./build"),
	assert = require('assert'),
	Q = require('q'),
	path = require('path'),
	rmdir = require('rimraf'),
	fs = require('fs');

describe.only("documentjs/lib/generators/html/build",function(){

	beforeEach(function(done){
		rmdir(path.join(__dirname,"..","site","static"), function(e){
			rmdir(path.join(__dirname,"..","site","templates"), done)
		});
	});

	it("get_renderer and get_partial work",function(done){
		Q.all([
			getRenderer('build/test/templates'),
			getPartials('build/test/templates')
		]).then(function(results){

			var renderer = results[0];

			var result = renderer({subject: "World"});

			assert.equal(result, "<html><h1>Hello World</h1></html>")
			done();
		},done).catch(done);
	});

	it("build.renderer build.templates build.helpers",function(done){

		var options = {
			html: { templates: path.join(__dirname,"test","templates_with_helpers") },
			dest: "XXXXYYYZZZ",
			forceBuild: true,
			pageConfig: {
				project: {
					source: "http://test.com"
				}
			}
		};
		buildTemplatesPromise = build.templates(options);

		var data = {subject: "World", message: "hello"};
		var getCurrent = function(){
			return data;
		};


		Q.all([
			build.renderer(buildTemplatesPromise, options),
			build.helpers(buildTemplatesPromise, {}, options, getCurrent)
		]).then(function(results){

			var renderer = results[0];

			var result = renderer({
				subject: "World",
				src: "./index.js",
				type: "",
				line: "100"
			});

			assert.equal(result, "<html><h1>HELLO World</h1>\n</html>")
			done();
		},done).catch(done);

	});

	it("Does ignoreTemplateRender",function(done){
		var options = {
			html: {templates: path.join(__dirname,"test","render_body_option")},
			dest: "XXXXYYYZZZ",
			forceBuild: true,
			pageConfig: {
				project: {
					source: "http://test.com"
				}
			}
		};
		buildTemplatesPromise = build.templates(options);

		var data = {message: "this isnt doing anything"};
		var getCurrent = function(){
			return data;
		};

		Q.all([
			build.renderer(buildTemplatesPromise, options),
			build.helpers(buildTemplatesPromise, {}, options, getCurrent)
		]).then(function(results){

			var renderer = results[0];

			var result = renderer({body: "{{message}} stuff"});

			assert.equal(result, "<html><h1>{{message}} stuff</h1>\n<p>static</p></html>")
			done();
		},done).catch(done);

	});

	it("builds the static dist", function(done){
		this.timeout(120000);
		build.staticDist({
			forceBuild: true,
			html: {dependencies: {"can-component": "3.0.0-pre.8"}}
		}).then(function(result){
			fs.readFile(path.join(__dirname, "..", result.distFolder, "bundles","static.css"), function(err, res){
				if(err) {
					done(err)
				} else {
					assert.ok(res, "got static.css");
					done();
				}
			});
		}, done)
	})

});
