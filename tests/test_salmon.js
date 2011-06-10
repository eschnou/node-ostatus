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
			this.me = { data: 'Hello World',
				    data_type: 'application/test' };
			this.sig = Salmon.generateSignature(this.me, this.key.private);
			this.callback();
		    },
		    'signature generated': function() {
			Assert.equal(this.sig.length, 256);
		    },
		    'can be verified': {
			topic: function() {
			    this.verified = Salmon.verifySignature(this.me, this.sig, this.key.public);
			    this.callback();
			},
			'verification successful': function() {
			    Assert.ok(this.verified);
			}
		    }
		}
        }
    }

}).run();
