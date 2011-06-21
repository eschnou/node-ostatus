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
	Path = require('path'),
	LTX = require('ltx'),
	Buffer = require('buffer').Buffer;

/*
 * Parse an incoming salmon message, and attempt to verify 
 * the signature.
 */	
function unpack(body, callback) {
	   xmlToJs(body, function(err, result) {
		   if (err) return callback(err);
		   // Keep a reference to the magic enveloppe
		   var me = result;
		   // Decode the activity entry from the enveloppe
		   var entry = Ostatus.salmon.base64url_decode(result.data);
		   // Parse the entry XML to JSON
		   Ostatus.as.parseEntry(entry, function(err, result) {
			   if (err) return callback(err);
			   // Keep a reference to the JSON activity
    		   var activity = result;
    		   // We need an actor URI to validate the signature
    		   if (activity.actor == undefined && activity.actor.uri == undefined) {
    			   return callback(new Error("Missing actor URI in activity entry"), false, activity);
    		   }
    		   // Keep a reference to the actor uri
			   var uri = activity.actor.uri;
			   // Webfinger to retrieve the actor public key
			   Ostatus.webfinger.lookup(uri, function(err, result) {
				  if (err) return callback(err, false, activity);
				  // Lookup the key from the webfinger JRD
				  var key = _grabKey(result);
				  if (!key) return callback(new Error("Could not find a key in user XRD"), false, activity);
				  // We need the second part of the key
				  key = key.href.split(',');
				  // Verify the signature (synchronous)
				  var result = Ostatus.salmon.verify_signature(me, key[1]);
				  return callback(false, result, activity);
			   });
		   });
	   });
}

/* TODO: rewrite with SAX */
function xmlToJs(body, callback) {
	try {
		var doc = Xml.parseFromString(body);
		var childNodes = doc.documentElement.childNodes;
		var result = {};
		result.sigs = [];
		for ( var i = 0; i < childNodes.length; i++) {
			var node = childNodes[i];
			var name = node.nodeName;
			if (name == "data") {
				result.data = node.nodeValue;
				if (attribute = node.attributes.getNamedItem("type")) result["data_type"] = attribute.value;
			} else if (name == "sig") {
				var sig = {"value": node.nodeValue};
				if (attribute = node.attributes.getNamedItem("key_id")) sig["key_id"] = attribute.value;
				result.sigs.push(sig);
			} else {
				var value = node.nodeValue;
				result[name] = value;
			}
		}
		callback(null, result);
	} catch (exception) {
		callback(exception);
	}
}

function _grabKey(jrd) {
	if (jrd != null && jrd.links != undefined) {
		for(var i=0; i<jrd.links.length; i++) {
			var link = jrd.links[i];
			if (link.rel == "magic-public-key") return link;
		}
	}
}

function signEnvelopeXML(data, privKey, data_type, key_id) {
    var me = signEnvelopeJSON(data, privKey, data_type, key_id);
    var meEl = new LTX.Element('me:env',
			      { 'xmlns:me': 'http://salmon-protocol.org/ns/magic-env' }).
	c('me:data',
	  { type: me.data_type }).t(me.data).up().
	c('me:encoding').t(me.encoding).up().
	c('me:alg').t(me.alg).up();
    me.sigs.forEach(function(sig) {
	var sigEl = meEl.c('me:sig').t(sig.value);
	if (sig.key_id)
	    sigEl.attrs.key_id = sig.key_id;
    });
    return meEl;
}

function signEnvelopeJSON(data, privKey, data_type, key_id) {
    var me = {
	data: base64url_encode(data),
	data_type: data_type || 'application/atom+xml',
	encoding: 'base64url',
	alg: 'RSA-SHA256'
    };

    var sig = {};
    sig.value = base64url_encode(generateSignature(me, privKey));
    if (key_id)
	sig.key_id = key_id;

    me.sigs = [sig];
    return me;
}

function verifyEnvelopeJSON(me, pubKey) {
    return me.sigs && me.sigs.some(function(sig) {
	return verifySignature(me, sig.value, pubKey);
    });
}

// Assemble the signature base string
function baseString(data, data_type, encoding, alg) {
    return [data /* already transported base64url-encoded */,
	    base64url_encode(data_type),
	    base64url_encode(encoding),
	    base64url_encode(alg)
	   ].join('.');
}

var Provenance = require('../../build/default/provenance');

function generateKeys() {
    var key = Provenance.generate();
    key.public = ["RSA",
		  base64url_encode(key.public.n),
		  base64url_encode(key.public.e)
		 ].join('.');
    return key;
}

function generateSignature(me, privKey) {
    var m = baseString(me.data, me.data_type,
		       me.encoding || 'base64url',
		       me.alg || 'RSA-SHA256');
    return Provenance.signRSASHA256(m, privKey);
}

function verifySignature(me, sig, pubKey) {
    var match;
    if ((match = pubKey.match(/^RSA\.([^\.]+)\.([^\.]+)$/))) {
	var m = baseString(me.data, me.data_type,
			   me.encoding || 'base64url',
			   me.alg || 'RSA-SHA256');
	return Provenance.verifyRSASHA256(m, base64url_decode(sig),
					  { n: base64url_decode(match[1]),
					    e: base64url_decode(match[2])
					  });
    }
    else
	throw TypeError('Invalid public key');
}

function base64url_decode(input) {
    return new Buffer(input.toString().replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

// Encode to Base64url and removing padding (as per salmon spec)
function base64url_encode(input) {
    return new Buffer(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
}

exports.unpack = unpack; 
exports.xmlToJs = xmlToJs;
exports.base64url_decode = base64url_decode;
exports.base64url_encode = base64url_encode;
exports.generateKeys = generateKeys;
exports.generateSignature = generateSignature;
exports.verifySignature = verifySignature;
exports.signEnvelopeJSON = signEnvelopeJSON;
exports.signEnvelopeXML = signEnvelopeXML;
exports.verifyEnvelopeJSON = verifyEnvelopeJSON;
