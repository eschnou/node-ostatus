var assert=require('assert');
var fs=require('fs');
var path=require('path');
var ostatus=require('ostatus');

/*
 * Test interoperability with an OpenSSL signed salmon magic enveloppe.
 */

function test_openssl(){
	assert.ok(ostatus.salmon.verify_signature(me, key));
}

var me = { 
		sigs: [ 
		        { value: "b_C8bzd9iF31lNFCkDvstOalH2mQVCFU5O04OC1xqoVTCpvQtt2V1JE-0cFKZ7XYErug0x5pz51dDg2ctVVIgK6mJmitF55-0RQNwtsVjCDsjKnd8s7ZmnGOYWWCGPgCQJ011AgAWnxacpCwb9W38BvJxKtwaOM0WSac9vgxY8g" } 
		      ],
		data: 'QWxsIHlvdXJzIGJhc2VzIGFyZSBiZWxvbmcgdG8gdXMuCg',
	    data_type: 'application/atom+xml',
	    encoding: 'base64url',
	    alg: 'RSA-SHA256' 
};

var key = "RSA.2YmPB7i6h_eJbkXWV8qaEfcI-V0JwQcj73ncG6KJx1TFPYxooYcMKGgK0IDV_em2KV4WEJu9HuedUyJkSDWHwSj18UvNfZ6Pue2uc6vFDPO8mN0q56PShGagdg4XdOxCXlUv2iAp7-malaJaIlLHyjhvxoVtD3itkXe2cgCed7c.AQAB";


test_openssl();