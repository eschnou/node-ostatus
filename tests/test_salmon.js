var Vows = require('vows'),
    Assert = require('assert'),
    Salmon = require('../lib/ostatus/salmon');

Vows.describe('Salmon').addBatch({

    generate: {
	'should work': {
		topic: function() {
		    this.key = Salmon.generateKeys();
		    this.callback();
		},
		'must have public key': function() {
		    Assert.ok(this.key.public.match(/^RSA\..+\..+/));
		},
		'must have private key': function() {
		    Assert.ok(typeof this.key.private === 'string');
		},
		'can be used to sign': {
		    topic: function() {
			var me = { data: 'Hello World',
				   data_type: 'application/test' };
			this.sig = Salmon.generateSignature(me, this.key.private);
			this.callback();
		    },
		    'signature generated': function() {
			console.log(this.sig.length);
		    }
		}
        }
    }

}).run();
