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

var Http  = require('http'),
	Https = require('https'),
	Url   = require('url');

function get(url, callback, headers) {
	request(url, false, 'GET', headers, null, callback);
}

function post(url, reqBody, headers, callback) {
	request(url, reqBody, 'POST', headers, null, callback);
}

function request(url, data, method, headers, parserGen, callback) {
    var body;
    var url = Url.parse(url);
    var host = url.hostname;
    var path = url.pathname;
    var headers = headers ? headers : {};
    var secure = (url.protocol == "https:") ? true : false;
    var port = secure ? 443 : 80;
    var client = secure ? Https : Http;
    
    // Add the mandatory HTTP Headers
    headers["host"] = secure ? host + ":443" : host;
    headers["user-agent"] = "node-ostatus";
    
    // If we post data, add a content length header
    // TODO The +1 is a hack, need to be fixed
    if (data) {
    	headers["Content-Length"] = data.length + 1;
    }
    
    // Add the query string to the path if any
    if (url.search != undefined) path += url.search;
  
    // Assemble the request options
    var options = {
    	host: host,
    	port: port,
    	path: path,
    	method: method,
    	headers: headers
    };

    // Proceed with the request
    var request = client.request(options, function (response) {
	if (parserGen) {
	    var parser = parserGen();
	} else {
	    body = '';
	}
	response.setEncoding('utf8');
        response.on('data', function (chunk) {
	    if (parser)
		parser(chunk);
	    else
		body += chunk;
          });
        response.on('end', function (chunk) {
       	   callback(null, response, body);
          });
    }).on('error', function(error) {
    	  console.log("HTTP request returned error: " + error.message);
    	  callback(error);
    });
  
    // Send the request
    if (data) {
        request.write(data);
    }
   	request.end();
}

function response(res, message, code, type) {
	var body = message;
	var type = type ? type : 'text/html';
	var code = code ? code : 200;
    res.writeHead(code, {
        'Content-Type': type + ";charser=UTF-8",
        'Content-Length': body.length
    });
    if (body) res.write(body);
    res.end();
}

exports.get = get;
exports.post = post;
exports.request = request;
exports.response = response;