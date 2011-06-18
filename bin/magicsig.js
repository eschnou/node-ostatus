#!/usr/bin/env node

var Util = require('util');
var Salmon = require('../lib/ostatus').salmon;


Util.puts("Generating key... this can take a while due to pure-JSness");
var keys = Salmon.generateKeys();

// Public
Util.puts("Public key:");
Util.puts("data:application/magic-public-key," + keys.public);
Util.puts("(Put it in your user's LRDD file)");

// Private
Util.puts("Private key:");
Util.puts(keys.private);
