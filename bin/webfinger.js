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
	Util = require('util'),
	Hcard = Ostatus.hcard,
	Webfinger = Ostatus.webfinger;

var _main = function(argv) {
	// Parse the command line arguments
	if (argv.length < 3) {
		console.log("Usage: finger [account]");
		process.exit(-1);
	}
	
	// Wrap the request in a try.. catch to nicely die on errors
	try {
		
		// Webfinger require acct: reference, we add if required
		var reference = argv[2];
		
		// TODO this is not clean, if no prefix is provided, I should try to discover if it is a http or acct uri.
		if (reference.length<5 || (reference.substring(0,5) != "acct:" && reference.substring(0,5) != "http:")) {
			reference = "acct:" + reference;
		}
		Webfinger.lookup(reference, _result);
	} catch (error) {
		_error(error);
	}
};

var _error = function(error) {
	console.log("Error: " + error.message);
	process.exit(-1);
}; 

var _result = function(error, result) {
	if (error) {
		_error(error);
	} else {
		console.log(Util.inspect(result));
	}
};

_main(process.argv);
