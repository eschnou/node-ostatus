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

var  Sys  = require('sys')
	,Url  = require('url')
    ,Xml  = require('o3-xml')
    ,Path = require('path')
    ,Mu 	 = require('mu')
    ,Http = require('./http.js');

function xrd(host, callback) {
	var context = {host: host};
	Mu.compile('xrd.xml.mu', function (err, parsed) {
	    if (err) return callback(err);
	    
	    var buffer = '';
	    Mu.render(parsed, context)
	      .on('data', function (c) { buffer += c.toString(); })
	      .on('end', function () {
	    	  callback(null, buffer);
	      });
	  });
}

function lrdd(subject, alias, links, callback) {
	var context = {
			subject: subject
		   ,alias: alias
		   ,links: links
	};
	
	Mu.compile('lrdd.xml.mu', function (err, parsed) {
	    if (err) return callback(err);   
	    var buffer = '';
	    Mu.render(parsed, context)
	      .on('data', function (c) { buffer += c.toString(); })
	      .on('end', function () {
	    	  callback(null, buffer);
	      });
	  });
}

function lookup(identifier, callback) {
    var url = Url.parse(identifier);
    if (url.protocol != "acct:") {
        callback(new Error("Protocol not supported"));
        return;
    }
    _fetchHostMeta(url.hostname, function (err, template) {
    	if (err) return callback(err);
    	_fetchUserMeta(template, identifier, function (err, meta) {
    			callback(err,meta);
    	});
    });
}

function parseAcct(pAcct) {
	// Add the acct prefix if required
	if (pAcct<5 || pAcct.substring(0,5) != "acct:") {
		pAcct = "acct:" + pAcct;
	}
	
	// Validate the user account
	var acct = Url.parse(pAcct);
	if (acct == undefined || acct.auth == undefined || acct.hostname == undefined) {
		return false;
	}
	
	// Return the parsed account
	var result = {};
	result.hostname = acct.hostname;
	result.username = acct.auth;
	return result;
}

function _fetchHostMeta(host, callback) {
	var url = "http://" + host + "/.well-known/host-meta";
	console.log("Requesting host meta at " + url);
   	Http.get(url, function(err, response, content) {
		if (err) return callback(err);
		if (response.statusCode == 200) {
   			var doc = Xml.parseFromString(content);
   			var nodes = doc.documentElement.selectNodes("descendant-or-self::node()[@rel='lrdd']");
   			callback(null, nodes[0].getAttribute("template"));
   		} else {
   			callback(new Error("Fetching host meta returned HTTP Status " + response.statusCode));
   		}
    });
}

function _fetchUserMeta(template, identifier, callback) {
	var url = template.replace("{uri}", identifier);
	console.log("Requesting user meta at " + url);
	Http.get(url, function(err, response, content) {
		if (err) return callback(err);
		if (response.statusCode == 200) {
	    	var links = [];
	    	var doc = Xml.parseFromString(content);
	    	callback(null, doc);
		} else {
   			callback(new Error("Fetching user meta returned HTTP Status " + response.statusCode));
		}
    });
}

exports.lookup = lookup; 
exports.xrd = xrd;
exports.lrdd = lrdd;
exports.parseAcct = parseAcct; 