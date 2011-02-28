#!/usr/bin/env node
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

var Ostatus = require('ostatus'),
	Hcard = Ostatus.hcard,
	Webfinger = Ostatus.webfinger;

var _main = function(argv) {
	// Parse the command line arguments
	if (argv.length < 3) {
		console.log("Usage: profile [identifier]");
		process.exit(-1);
	}
	
	// Webfinger require acct: identifier, we add if required
	var identifier = argv[2];
	if (identifier.length<5 || identifier.substring(0,5) != "acct:") {
		identifier = "acct:" + identifier;
	}
	
	// Wrap the request in a try.. catch to nicely die on errors
	try {
		Ostatus.profile(argv[2], function(err, result) {
			if (err) return _error(err);
			_result(result);
		}); 
	} catch (error) {
		_error(error);
	}
};

var _error = function(error) {
	console.log("Error: " + error.message);
	process.exit(-1);
}; 

var _result = function(result) {
	if (result != undefined) {
		for(key in result) {
			console.log(key + ": " + result[key]);
		}
	}
};

_main(process.argv);
