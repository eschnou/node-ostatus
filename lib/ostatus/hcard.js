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
    Xml  = require('o3-xml'),
    Path = require('path'),
	Mu 	 = require('mu');
    
function lookup(profile, callback) {
	console.log("Requesting hcard at " + profile);
    Http.get(profile, function(err, response, body) {
    	if (response.statusCode == 200) {
	    	var doc = Xml.parseFromString(body);
			vcardNode = _findVcardNode(doc);
			if (vcardNode != undefined) {
				elements = _findVcardElements(vcardNode);
				callback(null, elements);
			}
    	} else {
    		callback(new Error("HCard lookup returned HTTP status " + response.statusCode));
    	}
    });
}

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

function _findVcardNode(doc) {
	var nodes = doc.documentElement.selectNodes("//@class");
	for (i=0; i<nodes.length; i++) {
		var value = nodes[i].nodeValue;
		if (value.search(/(^|\s)vcard(\s|$)/i)>=0) {
			return nodes[i].parentNode;
		}
	}
	return undefined;
}

function _findVcardElements(node) {
	var nodes = node.selectNodes("//@class");
	var vcard = {};
	for (var i=0; i<nodes.length; i++) {
		var value = nodes[i].nodeValue;
		var element = _matchElement(value);
		if (element != undefined) {
			if (element == "photo") {
				vcard["photo"] = nodes[i].parentNode.attributes.getNamedItem("src").nodeValue;
			} else {
				vcard[element] = nodes[i].parentNode.nodeValue;
			}
		}
	}
	return vcard;
}

function _matchElement(value) {
	for (var i in elements) {
		re = new RegExp("(^|\\s)" + elements[i] + "(\\s|$)", "i");
		if (re.test(value)) {
			return elements[i];
		}
	}
	return undefined;
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