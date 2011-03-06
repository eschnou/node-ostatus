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

function verify_signature(data, data_type, encoding, alg, cert, signature) {
	var m = data + "." + base64url_encode(data_type) + "." + base64url_encode(encoding) + "." + base64url_encode(alg);
	var v = Crypto.createVerify('RSA-SHA256');
	v.update(m);
	return v.verify(cert, signature);
}

//From: https://github.com/ptarjan/base64url/blob/master/node.js
function base64url_decode(input) {
    return Base64.decode(input.replace(/-/g, '+').replace(/_/g, '/'));
}

function base64url_encode(input) {
	var buf = new Buffer(input);
    return Base64.encode(buf).replace(/\+/g, '-').replace(/\//g, '_');
}

exports.unpack = unpack; 
exports.base64url_decode = base64url_decode;
exports.base64url_encode = base64url_encode;
exports.verify_signature = verify_signature;