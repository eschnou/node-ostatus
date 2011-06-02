/*
 * node-ostatus - An implementation of OStatus for node.js
 * 
 * Copyright (C) 2010 Laurent Eschenauer <laurent@eschenauer.be>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*/

var Sys  = require('sys'),
	Url  = require('url'),
    Http = require('./http.js'),
    Sax  = require('sax'),
    Path = require('path'),
	Mu 	 = require('mu');

/*
 * Lookup for HCard content at the given profile url.
 *
 * The page is parsed for hcard markup and a JSON profile object is returned.
 *
 * @param {String} url
 * 			the url of the profile page containing some hcard markup
 * @param {Function} callback
 * 			a callback function in the form function(err, result)
 *
 * TODO Support for HTML pages that are not valid XML.
 */
function lookup(url, callback) {
	console.log("Requesting hcard at " + url);
    Http.get(url, function(err, response, body) {
    	if (response.statusCode == 200) {
	    var vcards = _findVcards(body);
	    if (vcards.length > 0) {
		return callback(null, vcards);
	    } else {
		callback(new Error("No HCard content in this profile page"));
	    }
    	} else {
    		callback(new Error("HCard lookup returned HTTP status " + response.statusCode));
    	}
    });
}

/*
 * Render a HCard HTML page from a JSON profile object. In practice, the profile
 * is simply used as input to the hcard.html.mu template.
 */
function render(profile, callback) {
	Mu.compile('hcard.html.mu', function (err, parsed) {
	    if (err) return callback(err);
	    
	    var buffer = '';
	    Mu.render(parsed, profile)
	      .on('data', function (c) { buffer += c.toString(); })
	      .on('end', function () {
	    	  callback(null, buffer);
	      });
	  });
}

///// Private functions
function _findVcards(content) {
    var vcardChildDepth = 0, fields;
    var vcards = [], vcard;
    var parser = Sax.parser();
    parser.onopentag = function(node) {
	if (node.attributes['class'] &&
	    node.attributes['class'].search(/(^|\s)vcard(\s|$)/i)>=0) {

	    vcardChildDepth = 1;
	    vcards.push(vcard = {});
	} else if (vcardChildDepth > 0) {
	    vcardChildDepth++;
	}

	if (vcardChildDepth > 0) {
	    fields = node.attributes['class'] &&
		node.attributes['class'].split(/\s/).filter(function(field) {
		    return elements.indexOf(field);
		}) ||
		[];
	}
    };
    parser.ontext = function(s) {
	if (vcardChildDepth > 0) {
	    fields.forEach(function(field) {
		vcard[field] = s.trim();
	    });
	}
    };
    parser.onclosetag = function() {
	if (vcardChildDepth > 0)
	    vcardChildDepth--;
    };

    parser.write(content).close();
    return vcards;
}

var elements = [
"fn",
"n",
"adr",
"agent",
"bday",
"category",
"class",
"email",
"geo",
"key",
"label",
"logo",
"mailer",
"nickname",
"note",
"org",
"photo",
"avatar",
"rev",
"role",
"sort-string",
"sound",
"tel",
"title",
"tz",
"uid",
"url",              
];

exports.lookup = lookup; 
exports.render = render;