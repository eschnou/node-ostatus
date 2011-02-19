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

var Http = require('http'),
	Url  = require('url');

function get(url, callback, headers) {
    var url = Url.parse(url);
    var host = url.hostname;
    var path = url.pathname;
    var headers = headers ? headers : {};
    var secure = (url.protocol == "https:") ? true : false;
    var port = secure ? 443 : 80;
    
    headers["Host"] = host;
    
    if (url.search != undefined) path += url.search;
  
    var client = Http.createClient(port, host, secure);
    var request = client.request('GET', path, headers);
    var body = "";
    
    client.on('error', function(err) {
    	callback(err);
    });
    
    request.on('response', function (response) {
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            body += chunk;
          });
        response.on('end', function (chunk) {
       	   callback(null, response, body);
          });
    });
  
   	request.end();
}

function post(url, reqBody, headers, callback) {
    var url = Url.parse(url);
    var host = url.hostname;
    var path = url.pathname;
    var body = body ? body : "";
    var headers = headers ? headers : {};
    var secure = (url.protocol == "https:") ? true : false;
    var port = secure ? 443 : 80;
    
    headers["Host"] = host;
    headers["Content-Length"] = reqBody.length;
    
    if (url.search != undefined) path += url.search;
    
    var client = Http.createClient(port, host, secure);
    var request = client.request('POST', path, headers);
    var resBody  = "";
    
    request.on('response', function (response) {
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            resBody += chunk;
          });
        response.on('end', function (chunk) {
       	   callback(null, response, resBody);
          });
    });
    
    request.write(reqBody);
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
exports.response = response;