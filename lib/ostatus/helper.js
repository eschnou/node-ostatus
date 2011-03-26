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

var Hcard = require("./hcard")
,	As = require("./as")
,	Webfinger = require("./webfinger");

function activities(identifier, callback) {
	// Fix arguments
	if (identifier.length<5 || (identifier.substring(0,5) != "acct:" && identifier.substring(0,5) != "http:")) {
		identifier = "acct:" + identifier;
	}

	// Perform a webfinger lookup on the identifier, 
	// then search for the activities link and if there is one,
	// fetch the feed and parse it to Json.
	Webfinger.lookup(identifier, function(err, result) {
		if (err) callback(err);
    	var links = result.links;
    	for (i=0;i<links.length;i++) {
    		var link = links[i];
    		if (link.rel == "http://schemas.google.com/g/2010#updates-from") {
    			As.fromUrl(link.href, callback);
    		}
    	}
	}); 
};

function profile(identifier, callback) {
	// Fix arguments
	if (identifier.length<5 || (identifier.substring(0,5) != "acct:" && identifier.substring(0,5) != "http:")) {
		identifier = "acct:" + identifier;
	}
	
	// Perform a webfinger lookup on the identifier, 
	// then search for the hcard link and if there is one,
	// fetch the page and parse it to Json.
	Webfinger.lookup(identifier, function(err, result) {
		if (err) callback(err);
    	var links = result.links;
    	for (i=0;i<links.length;i++) {
    		var link = links[i];
    		if (link.rel == "http://microformats.org/profile/hcard") {
    			Hcard.lookup(link.href, callback);
    		}
    	}
	}); 
}

exports.activities = activities;
exports.profile = profile;