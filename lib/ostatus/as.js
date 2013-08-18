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
	Flow = require('flow'),
	Util = require('util'),
	Http = require('./http.js'),
    Sax  = require('sax');
	Path = require('path'),
	Mu 	 = require('mu');

function render(host, updates, profile, callback) {
	Mu.compile('updates.xml.mu', function (err, parsed) {
	    if (err) return callback(err);
	    var buffer = '';
	    var context = profile;
	    context.updates = updates;
	    context.host = host;
	    if (updates && updates.length > 0) context.updated = updates[0].updated;
	    Mu.render(parsed,context)
	      .on('data', function (c) { buffer += c.toString(); })
	      .on('end', function () {callback(null, buffer);})
	      .on('error', function(err) {callback(err, buffer);});
	  });
}

function fromUrl(url, callback) {
	console.log("Requesting atom feed at " + url);
	var feedParser;
	Flow.exec(
			function() {
				Http.request(url,false,'GET',null,function() {
				    feedParser = new FeedParser();
				    return function(s) {
					feedParser.write(s);
				    };
				}, this);
			},
			function(err,response,body) {
			if (feedParser) feedParser.end();
		    	if (err) return callback(err);
		    	if (response.statusCode != 200) return callback(new Error("Http request returned status " + response.statusCode));
		    	/*fromXml(body, this);*/
			this(null, feedParser.feed);
			},
			function(err, activities) {
				if (err) return callback(err);
				activities.url = url;
				callback(null, activities);
			}
	);
}

function FeedParser() {
    var feed = this.feed = { links: [], entries: [] };

    var treeNames = [], elText, entry;
    this.parser = new Sax.parser();
    this.parser.onopentag = function(node) {
	treeNames.push(node.name);
	elText = '';

	if (treeNames[0] === 'FEED') {
	    if (treeNames[1] === 'LINK' && treeNames.length < 2)
		feed.push(node.attributes);
	    else if (treeNames[1] === 'ENTRY') {
		if (treeNames.length === 2) {
		    feed.entries.push(entry = { links: [] });
		} else if (treeNames[2] === 'LINK' && treeNames.length === 3) {
		    entry.links.push(node.attributes);
		} else if (treeNames[2] === 'AUTHOR') {
		    if (treeNames.length === 3)
			entry.author = { links: [] };
		    else if (treeNames[3] === 'LINK' && treeNames.length === 4)
			entry.author.links.push(node.attributes);
		}
	    }
	}
    };
    this.parser.ontext = function(s) {
	elText += s;
    };
    this.parser.oncdata = function(s) {
	elText += s;
    };
    this.parser.onclosetag = function() {
	if (treeNames[0] === 'FEED') {
	    switch(treeNames[1]) {
	    case 'TITLE':
		feed.title = elText;
		break;
	    case 'SUBTITLE':
		feed.subtitle = elText;
		break;
	    case 'UPDATED':
		feed.updated = elText;
		break;
	    case 'ENTRY':
		switch(treeNames[2]) {
		case 'ID':
		    entry.id = elText;
		    break;
		case 'TITLE':
		    entry.title = elText;
		    break;
		case 'VERB':
		    entry.verb = elText;
		    break;
		case 'TYPE':
		    entry.type = elText;
		    break;
		case 'CONTENT':
		    entry.content = elText;
		    break;
		case 'UPDATED':
		    entry.updated = elText;
		    break;
		case 'AUTHOR':
		    switch(treeNames[3]) {
		    case 'OBJECT-TYPE':
			entry.author.type = elText;
			break;
		    case 'URI':
			entry.author.uri = elText;
			break;
		    case 'NAME':
			entry.author.name = elText;
			break;
		    }
		}
		break;
	    }
	}

	elText = '';
	treeNames.pop();
    };
};
FeedParser.prototype.write = function(s) {
    this.parser.write(s);
};
FeedParser.prototype.end = function() {
    this.parser.close();
};



exports.fromUrl = fromUrl;
//exports.parseFeed = parseFeed;
//exports.parseEntry = parseEntry;
exports.render = render;