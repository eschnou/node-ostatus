node-ostatus
============

An implementation of the [OStatus](http://ostatus.org) protocol stack for node.js

Copyright (C) 2010 Laurent Eschenauer <laurent@eschenauer.be>

Version 0.1.0 - Released March 6th 2011.

** This is a very early release. Do not even think about using this code in production... yet :-)** 

Install
-------

If you are using npm (the node packet manager), installing is as easy as:
    npm install ostatus


Dependencies
------------

If you are using this from source, you can install the dependencies using npm from the root of the source folder:
    npm bundle

Or you can install all dependencies manually:
*  [node](http://nodejs.org/) v4+ is required, I'm developing against trunk.
*  [node-o3-xml](https://github.com/ajaxorg/node-o3-xml/)
*  [Mu](https://github.com/raycmorgan/Mu/tree/v2) the v2 branch
*  [Flow](https://github.com/willconant/flow-js)
*  [Base64](https://github.com/pkrumins/node-base64)

Documentation
-------------

The API is documented in the [wiki](http://github.com/eschnou/node-ostatus/wiki). 

Support
-------

Please avoid sending an email directly to me. Instead, involve also other users by:

-  Filling an issue report in the [issue tracker](https://github.com/eschnou/node-ostatus/issues).
-  Asking your question on the [Ostatus](http://groups.google.com/group/ostatus-discuss) or [NodeJS](http://groups.google.com/group/nodejs) mailing list.
-  Ping me on twitter [@eschnou](http://twitter.com/eschnou) <== Ho irony :-) 

Client
------

In the bin/ folder, you'll find a few simple command line clients for ostatus. If you install with NPM, 
these will be linked and added to your path. 

### Status
Display the last status update of someone:
	status eschnou@identi.ca

Output:
    2011-03-06T14:25:08+00:00
    One day, I'll post these kind of updates from my own host. In the meanwhile, cheers !

### Profile
Display the profile of someone
	profile eschnou@identi.ca
	
Output:
    photo: 'http://avatar.identi.ca/16106-96-20080722053859.png',
    nickname: 'eschnou',
    fn: 'Laurent',
    label: 'Liège, Belgium',
    url: 'http://eschnou.com',
    note: 'Coder, not blogger. Technology enthusiast. Exploring the future of the web & mobility.'

Progress
--------

The following pieces of the protocol are implemented:

-  [webfinger](http://code.google.com/p/webfinger/): 
   * Lookup a user account and return the user meta in a JSON format
   * Rendering of host/user meta based on a JSON input object
-  [pubsubhubbub](http://code.google.com/p/pubsubhubbub/): 
   * Subscribe/Unsubscribe to a topic on another hub
   * Verify a subscription request from an other hub
   * Distribute content to subscribers (with support for authenticated content distribution)
-  [hcard](http://microformats.org/wiki/hcard):
   * Lookup and parse a hcard into a JSON object
   * Render an hcard from a JSON object
-  [activitystreams](http://activitystrea.ms/):
   * Fetch an atom feed with activitystream content and return a JSON representation of the stream. The JSON object is a valid activitystream JSON object.
   * Render an atom feed from an array of activities in JSON
-  [salmon](http://www.salmon-protocol.org/)
   * Unpacking envelope and base64url encoding/decoding 

What is missing:

-  Magic envelope signature generation and verification.
-  Activitystream stuff is basic and maybe outdated.


My ToDo list
------------

-  Get rid of o3-xml and use a Sax parser instead.
-  Get rid of the templates and generate the XML programaticaly.
-  Write more test cases.
-  Implement Salmon crypto stuff.
-  Complete the activitystream stuff.


License
-------

The MIT License

Copyright (c) 2010 Laurent Eschenauer <laurent@eschenauer.be>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
