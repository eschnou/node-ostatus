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

var Sys  = require('util'),
    Url  = require('url'),
    Crypto = require('crypto'),
    Http = require('./http.js'),
    Util = require('util'),
    Qs 	 = require('querystring');

    
function verify(request, callback) {
	var subscriber = request["hub.callback"];
	var challenge = _secret(12);
	var query = {
		"hub.mode": request["hub.mode"],
		"hub.topic": request["hub.topic"],
		"hub.challenge": challenge,
		"hub.lease_seconds": 60 * 60 // one hour lease for now
	};
	
	if (request["hub.verify_token"] != undefined) {
		query["hub.verify_token"] = request["hub.verify_token"];
	}
	
	var url = subscriber + "?" + Qs.stringify(query);
	
	Http.get(url, function(err, response, body) {
		if (err) return callback(err);
		if (body == challenge) {
			callback(null, request["hub.topic"]);
		} else {
			callback(new Error("Challenge did not match, expecting " + challenge + " but received " + body));
		}
	});
}

function subscribe(url, config, callback) {
	var data = Qs.stringify(config);
	var headers = {"Content-Type": "application/x-www-form-urlencoded"};
	console.log("Url: " + url);
	console.log("Data: " + data);
	Http.post(url, data, headers, function(err, response, body) {
		if (err) return callback(err);
		if (response.statusCode == 202) {
			callback(null, "pending");
		} else if (response.statusCode == 204) {
			callback(null, "accepted");
		} else {
			callback(new Error("Push subscribe http error " + response.statusCode + "\n" + body));
		} 
	});
}

function sign(data, secret) {
	// Since we'll push the data over HTTP in UTF-8,
	// we encode the data to a utf-8 buffer fot the hmac.
	var buffer = new Buffer(data, 'utf-8');
	var hmac = Crypto.createHmac("sha1", secret);
	var hash = hmac.update(buffer);
	return hmac.digest(encoding="hex");
}

function distribute(data, url, secret, callback) {
	var headers = {"Content-Type": "application/atom-xml"};
	
	// I guess someone adds one of these and this is why I need to take
	// it into account for the hmac.
	data = data + "\r";
	
	//console.log("Data: ===" + data + "===");
	//console.log("Secret: ===" + secret + "===");
	//console.log("Data size: " + data.length);
	
	if (secret != undefined) {
		var digest = "sha1="+  sign(data , secret);
		headers["X-Hub-Signature"] = digest;
		console.log("Digest: " + digest);
	}
	
	Http.post(url, data, headers,  function(err, response, body) {
		if (err) return callback(err);
		if (response.statusCode >= 200 && response.statusCode < 300) {
			callback(null, response.statusCode, body);
		} else {
			callback(new Error("Push distribute returned HTTP Status " + response.statusCode));
		}
	});
}

function _secret(size) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < size; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

exports.verify = verify;
exports.distribute = distribute;
exports.subscribe = subscribe;
exports.sign = sign;