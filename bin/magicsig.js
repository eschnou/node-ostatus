#!/usr/bin/env node

var Util = require('util');
var Bn = require('bignumber');
var Salmon = require('ostatus').salmon;

var bits = 2048;
var exponent = 'deadbeef';


var key = new Bn.Key();
Util.puts("Generating key... this can take a while due to pure-JSness");
key.generate(bits, exponent);

// Public
Util.puts("Public key:");
Util.puts("data:application/magic-public-key,RSA." +
	  Salmon.base64url_encode(key.n.toByteArray()) +
	  "." +
	  Salmon.base64url_encode(new Bn.BigInteger(exponent, 16).toByteArray()));

// Private
Util.puts("Private key:");
Util.puts(Salmon.base64url_encode(key.d.toByteArray()));
