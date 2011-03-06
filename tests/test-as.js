var assert = require('assert');
var fs = require('fs');
var path = require('path');
var ostatus = require('ostatus');
var xml = fs.readFileSync(path.join(__dirname, 'test-as.xml'), 'utf-8');

function test_render() {
	ostatus.as.render("http://example.com", activities, profile, function(err, result) {
		assert.equal(result, xml, "Xml output did not match expected result.");
	});
}

var activities = [
                  {
                	id: "tag:eschnou@shoutr.org,2011-03-06:FKZbF1nx",
                	title: "Hello, World",
                	content: "Hello, <b>World</b>",
                	verb: "post",
                	type:"note",
                	updated:"2011-03-06T15:02:56"
                  },
                  {
                  	id: "tag:eschnou@shoutr.org,2011-03-07:FKdgfF1nx",
                  	title: "Another one for the road.",
                  	content: "Another one for the road.",
                  	verb: "post",
                  	type:"note",
                  	updated:"2011-03-07T09:02:56"
                  }
];

var profile = {
               username: "eschnou",
               fullname: "Laurent Eschenauer",
               avatar: "http://shoutr.org/avatar/eschnou.jpg"
};

test_render();
