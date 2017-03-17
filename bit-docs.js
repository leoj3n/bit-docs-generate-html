var generator = require("./html");
var _ = require("lodash");
var tags = require("./tags/tags");

var mergeOnto = function(prop, dest, source){
    if(source[prop]) {
        dest[prop] = dest[prop].concat(source[prop])
    }
};

module.exports = function(bitDocs){
    bitDocs.register("generator", generator);

	bitDocs.register("tags", tags);

    bitDocs.handle("html", function(siteConfig, htmlConfig) {
        if(!siteConfig.html) {
            siteConfig.html = {
                dependencies: {},
                static: [],
                templates: []
            };
        }
        var html = siteConfig.html;
        _.assign(html.dependencies, htmlConfig.dependencies || {});

				//debugger;
				console.log ( 'ABOUT TO MERGE ONTO' );

        mergeOnto("static", html, htmlConfig);
        mergeOnto("templates", html, htmlConfig);
	});
};
