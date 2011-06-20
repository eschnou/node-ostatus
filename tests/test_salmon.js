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
    },

    /* http://code.google.com/p/salmon-protocol/issues/detail?id=8 */
    'invalid spec example': {
	'should work': {
		topic: function() {
		    var pubKey = "RSA.mVgY8RN6URBTstndvmUUPb4UZTdwvwmddSKE5z_jvKUEK6yk1u3rrC9yN8k6FilGj9K0eeUPe2hf4Pj-5CmHww.AQAB";
		    var sig = "EvGSD2vi8qYcveHnb-rrlok07qnCXjn8YSeCDDXlbhILSabgvNsPpbe76up8w63i2fWHvLKJzeGLKfyHg8ZomQ";
		    var data = "PD94bWwgdmVyc2lvbj0nMS4wJyBlbmNvZGluZz0nVVRGLTgnPz4KPGVudHJ5IHhtbG5zPS" +
			    "dodHRwOi8vd3d3LnczLm9yZy8yMDA1L0F0b20nPgogIDxpZD50YWc6ZXhhbXBsZS5jb20s" +
			    "MjAwOTpjbXQtMC40NDc3NTcxODwvaWQ-ICAKICA8YXV0aG9yPjxuYW1lPnRlc3RAZXhhbX" +
			    "BsZS5jb208L25hbWUPHVyaT5hY2N0OmpwYW56ZXJAZ29vZ2xlLmNvbTwvdXJpPjwvYXV0a" +
			    "G9yPgogIDx0aHI6aW4tcmVwbHktdG8geG1sbnM6dGhyPSdodHRwOi8vcHVybC5vcmcvc3l" +
			    "uZGljYXRpb24vdGhyZWFkLzEuMCcKICAgICAgcmVmPSd0YWc6YmxvZ2dlci5jb20sMTk5O" +
			    "TpibG9nLTg5MzU5MTM3NDMxMzMxMjczNy5wb3N0LTM4NjE2NjMyNTg1Mzg4NTc5NTQnPnR" +
			    "hZzpibG9nZ2VyLmNvbSwxOTk5OmJsb2ctODkzNTkxMzc0MzEzMzEyNzM3LnBvc3QtMzg2M" +
			    "TY2MzI1ODUzODg1Nzk1NAogIDwvdGhyOmluLXJlcGx5LXRvPgogIDxjb250ZW50PlNhbG1" +
			    "vbiBzd2ltIHVwc3RyZWFtITwvY29udGVudD4KICA8dGl0bGUU2FsbW9uIHN3aW0gdXBzdH" +
			    "JlYW0hPC90aXRsZT4KICA8dXBkYXRlZD4yMDA5LTEyLTE4VDIwOjA0OjAzWjwvdXBkYXRl" +
			    "ZD4KPC9lbnRyeT4KICAgIA";
		    var data_type = "application/atom+xml";
		    this.verified = Salmon.verifySignature({ data: Salmon.base64url_decode(data),
							     data_type: data_type },
							   Salmon.base64url_decode(sig), pubKey);
		    this.callback();
		},
		verifies: function() {
		    Assert.ok(this.verified);
		}
	}
    }

    /* More test cases can be found at:
     * http://code.google.com/p/salmon-protocol/source/browse/trunk/lib/python/magicsig/magicsig_test.py
     */

}).run();
