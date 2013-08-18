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

var  Sys  = require('util')
	,Url  = require('url')
    ,Sax  = require('sax')
    ,Path = require('path')
    ,Mu 	 = require('mu')
    ,Http = require('./http.js');

/*
 * Generate the domain's host-meta XRD.
 * 
 * This function simply process the hostXrd.xml.mu template and output the result. The template
 * is a fairly basic one with just a LRDD link indicating how to fetch a user XRD.
 * 
 * @param {String} host 
 * 			the domain name
 * @param {Function} callback 
 * 			a callback function in the form function(err, result) 
 * 
 */
function hostXrd(host, callback) {
	var context = {host: host};
    var buffer = '';

    Mu.compile('hostXrd.xml.mu', function (err, parsed) {
	    if (err) return callback(err);
	    Mu.render(parsed, context)
	      .on('data', function (c) { buffer += c.toString(); })
	      .on('end', function () { callback(null, buffer); });
    });
}


/*
 * Generate a user's XRD.
 * 
 * This function simply process the userXrd.xml.mu template and fill-in the subject, alias and links.
 * 
 * @param {String} subject 	
 * 			the value of the subject item. This should be the acct uri that is being served.
 * @param {String} alias
 * 			an alias field. Usually a HTTP URI identifying the same user resource.
 * @param {Array} links
 * 			an array of links to be added in the XRD.
 * @param {Function} callback 
 * 			a callback function in the form function(err, result)
 *  
 * A link has the form: 
 * var link = {
 * 	"href":	"..",
 *  "rel" : "..",
 *  "type": "..",
 *  "ref" : "..
 * }
 * 
 * TODO Allow for more than one alias (array instead of single value)
 * 
 */
function userXrd(subject, alias, links, callback) {
    var buffer = '';
	var context = {
			subject: subject
		   ,alias: alias
		   ,links: links
	};
	
	Mu.compile('userXrd.xml.mu', function (err, parsed) {
	    if (err) return callback(err);   
	    Mu.render(parsed, context)
	      .on('data', function (c) { buffer += c.toString(); })
	      .on('end', function () {callback(null, buffer);});
	});
}

/*
 * Perform a webfinger lookup for the provided acct: uri, the result is a JSON representation
 * of the user XRD. 
 * 
 * @param {String} identifier
 * 			a string representation of a valid acct: uri
 * @param {Function} callback
 * 			a callback function of the form function(err, result) 
 * 
 * The XRD object has the form:
 * var xrd = {
 * 		"subject": 	the subject of the xrd lookup
 * 		"alias"	 : 	an array of strings (a xrd can have more than one alias)
 *      "links"  :  an array of links 
 * }
 * 
 * TODO Add support for HTTP URIs
 */
function lookup(identifier, callback) {
    var url = Url.parse(identifier);
    if (url.protocol != "acct:" && url.protocol != "http:") {
        callback(new Error("Protocol not supported"));
        return;
    }
    _fetchHostMeta(url.hostname, function (err, template) {
    	if (err) return callback(err);
    	_fetchUserMeta(template, identifier, function (err, meta) {
    		if (err) return callback(err);
    		return callback(null, meta);
    	});
    });
}

/*
 * Parse a string representation of an acct uri and return the username and
 * hostname parts. The input can ommit the acct: prefix.
 * 
 * @param {String} pAcct
 * 			a string representing an acct: uri (prefix can be omitted)
 *
 * @return
 * 		an object with a username and hostname property
 * 
 * Example: 
 * parseAcct("user@example.com") will return:
 * { "username": "user", "hostname": "example.com"}
 */
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

/////// Private helper functions

/*
 * Get the host XRD.
 */
function _fetchHostMeta(host, callback) {
	var url = "http://" + host + "/.well-known/host-meta";
	console.log("Requesting host meta at " + url);
   	Http.get(url, function(err, response, content) {
		if (err) return callback(err);
		if (response.statusCode == 200) {
			try {
			    callback(null, _parseHostMeta(content));
			} catch (e) {
			    callback(e);
			}
   		} else {
   			callback(new Error("Fetching host meta returned HTTP Status " + response.statusCode));
   		}
    });
}

function _parseHostMeta(content) {
    var template;
    var parser = Sax.parser();
    parser.onopentag = function(node) {
	/* descendant-or-self::node()[@name='link' and @rel='lrdd']/@template */
	if (node.name === 'LINK' &&
	    node.attributes.rel === 'lrdd' &&
	    node.attributes.template)
	    template = node.attributes.template;
    };
    parser.write(content).close();
    return template;
}

/*
 * Get a user LRDD from a trmplate URI and an identifier.
 */
function _fetchUserMeta(template, identifier, callback) {
	var url = template.replace("{uri}", identifier);
	console.log("Requesting user meta at " + url);
	Http.get(url, function(err, response, content) {
		if (err) return callback(err);
		if (response.statusCode == 200) {
		    try {
			callback(null, _parseUserMeta(content));
		    } catch(e) {
			callback(e);
		    }
		} else {
   			callback(new Error("Fetching user meta returned HTTP Status " + response.statusCode));
		}
    });
}

/*
 * Parse a user LRDD into a JSON object.
 */
function _parseUserMeta(content) {
	var result = {
			"alias": [],
			"links": []
	};
	var parser = Sax.parser(), state;
	parser.onopentag = function(node) {
	    switch(node.name) {
	    case 'SUBJECT':
		    state = 'subject';
		    break;
	    case 'LINK':
		    result.links.push(node.attributes);
		    break;
	    case 'ALIAS':
		    state = 'alias';
		    break;
	    }
	}
	/* TODO: for multiple invokations, and w/ cdata */
	parser.ontext = function(s) {
	    switch(state) {
	    case 'subject':
		result.subject = s;
		break;
	    case 'alias':
		result.alias.push(s);
		break;
	    }
	};
	parser.onclosetag = function() {
	    state = null;
	};
	parser.write(content).close();

	return result;
}

exports.lookup = lookup; 
exports.hostXrd = hostXrd;
exports.userXrd = userXrd;
exports.parseAcct = parseAcct; 