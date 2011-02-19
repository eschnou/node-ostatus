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
	Util = require('util'),
	Http = require('./http.js'),
    Xml  = require('o3-xml');
	Path = require('path'),
	Mu 	 = require('mu');

function render(updates, profile, callback) {
	Mu.compile('updates.xml.mu', function (err, parsed) {
	    if (err) return callback(err);
	    var host = global.config.host;
	    var buffer = '';
	    var context = profile;
	    context.updates = updates;
	    context.host = host;
	    Mu.render(parsed,context)
	      .on('data', function (c) { buffer += c.toString(); })
	      .on('end', function () {callback(null, buffer);})
	      .on('error', function(err) {callback(err, buffer);});
	  });
}

function parseFeed(url, callback) {
	console.log("Requesting atom feed at " + url);
    Http.get(url, function(err, response, body) {
    	try {
	    	var doc = Xml.parseFromString(body);
	    	var childNodes = doc.documentElement.childNodes;
	    	var feed = {};
	    	feed.items = [];
	    	feed.links = [];
	    	feed.url = url;
	    	var items = [];
	    	for (var i=0; i<childNodes.length; i++) {
	    		var name = childNodes[i].nodeName;
	    		if (name == "entry") {
	    			var entry = _readEntry(childNodes[i]);
	    			if (entry) feed.items.push(entry);
	    		} else if (name == "link") {
	    			var link = _readLink(childNodes[i]);
	    			if (link) feed.links.push(link);
	    		} else if (name == "title") {
	    			feed.title = childNodes[i].nodeValue;
	    		} else if (name == "subtitle") {
	    			feed.subtitle = childNodes[i].nodeValue;
	    		} else if (name == "updated") {
	    			feed.updated = childNodes[i].nodeValue;
	    		}
	    	}
	    	callback(null, feed);
    	} catch (exception) {
    		callback(exception);
    	}
    });
}

var _elements = {
		"title": _parseTitle,
		"verb" : _parseVerb,
		"content": _parseContent,
		"updated": _parseUpdated
};

function _readLink(node) {
	var link = _readAttributes(node, ["href", "rel", "type"]);
	return link;
}

function _readEntry(node) {
	var childNodes = node.childNodes;
	var entry = {};
	for (var i=0; i<childNodes.length; i++) {
		var name = childNodes[i].nodeName;
		if (name in _elements) {
			_elements[name](childNodes[i], entry);
		}
	}
	return entry;
}

function _readAttributes(node, attributes) {
	var result = {};
	for(i= 0; i<attributes.length; i++) {
		var name = attributes[i];
		if (attribute = node.attributes.getNamedItem(name)) result[name] = attribute.value;
	}
	return result;
}

function _parseTitle(node, entry) {
	if (node != null) {
		entry["title"] = node.nodeValue;
	}
	return entry;
}

function _parseVerb(node, entry) {
	if (node != null) {
		var verb = node.nodeValue;
		entry["verb"] = verb.substr(verb.lastIndexOf("/") + 1);
	}
	return entry;
}

function _parseContent(node, entry) {
	if (node != null) {
		var body = node.nodeValue;
		entry["body"] = body;
	}
	return entry;
}

function _parseUpdated(node, entry) {
	if (node != null) {
		var updated = node.nodeValue;
		// TODO Convert to W3CDTF
		entry["postedTime"] = updated;
	}
	return entry;
}


exports.parseFeed = parseFeed; 
exports.render = render;