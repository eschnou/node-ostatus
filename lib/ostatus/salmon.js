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
    Xml  = require('o3-xml');
	Path = require('path'),
	Mu 	 = require('mu');
	Base64 = require('base64');
	Crypto = require('crypto');
	Bn     = require('bignumber');
	Buffer = require('buffer').Buffer;

function unpack(body, callback) {
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

function verify_signature(me, key) {
	// Assemble the signature base string
	var M = me.data + "." + base64url_encode(me.data_type, 'ascii') + "." + base64url_encode(me.encoding, 'ascii') + "." + base64url_encode(me.alg, 'ascii');

	// Compute the SHA256 digest hash
	var sha256 = Crypto.createHash('sha256');
	sha256.update(M);
	var hash = sha256.digest('hex');
	
	// Decode the signature from the base64url encoded value we have in the envelope
	var sig = Bn.b64toBA(me.sigs[0].value.replace(/-/g, '+').replace(/_/g, '/'));
	
	// Extract the key elements from the key encoding
	var key = key.replace(/-/g, '+').replace(/_/g, '/').split('.');
	var n = Bn.b64tohex(key[1]);
	var e = "10001"; //Rsa.b64tohex(key[2]);
	
	// Prepare the RSA Engine
	var rsa = new Bn.Key();
	rsa.setPublic(n, e);

	// Perform RSA Public on the signature string
	var v = rsa.doPublic(new Bn.BigInteger(sig));
	
	// Convert the verified output into a string and keep the last 64 characters
	var buf = new Buffer(v.toByteArray());
	var b = buf.toString('ascii', buf.length-64);
	
	// This should match the hash we have computed
	if (hash == b) {
		return true;
	} else {
		return false;
	}
}

//From: https://github.com/ptarjan/base64url/blob/master/node.js
function base64url_decode(input) {
    return Base64.decode(input.replace(/-/g, '+').replace(/_/g, '/'));
}

// Encode to Base64url and removing padding (as per salmon spec)
function base64url_encode(input) {
	var buf = new Buffer(input);
    return Base64.encode(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
}

exports.unpack = unpack; 
exports.base64url_decode = base64url_decode;
exports.base64url_encode = base64url_encode;
exports.verify_signature = verify_signature;