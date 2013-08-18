node-ostatus
============

An implementation of the [OStatus](http://ostatus.org) protocol stack for node.js

Copyright (C) 2010 Laurent Eschenauer <laurent@eschenauer.be>

** Ongoing development branch, unstable code, use at your own risk :-) **

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

Contribute
----------

Want to help ? That's awesome ! I'm doing this just a couple hours a week, between a full-time job 
and a six months old baby :-) So, of course, any help is welcome ! What you can do:

-  Try it out. With the command line, or in a project, and let me know what works, what does not. We need
to get the interoperability right. Probably a lot of edge cases remain to be solved.
-  Use it in a project and provide feedback on the API. Does it fit you need ? What else do you need ?
If the documentation is weak, don't hesitate to edit the wiki and make it better.
-  Want to add a feature or refactor some code (see the todo list below). Then the best is to first get in 
touch with me, since I'm actively working on it, you don't want to waste your time on something I did already. 

I accept pull-requests, but would appreciate if:

-  You package it on a separate feature branch and make sure it is rebased on top of the dev branch.
-  Do not merge the upstream with your work, instead you should rebase your work on top of the upstream.
-  Use one branch for one feature.

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

-  Implement Salmon crypto stuff. Unfortunately the node crypto lib is not enough, 
and a new RSA lib is required. Either full javascript or C++
-  Complete the activitystream stuff, ensuring mapping between XML and internal 
JSON data structure.
-  Lot's of edge cases and interop issues to fix.
-  Get rid of o3-xml and use a Sax parser instead.
-  Get rid of the templates and generate the XML programaticaly.
-  Write more test cases.


Acknowledgments
---------------
This code is a 100% rewrite by myself, however:

-  The idea of using Mustache templates for OStatus payload come from the [ostatus-js](https://github.com/maxogden/ostatus-js) project by maxodgen.
-  The webfinger implementation is inspired by the [node-webfinger](https://github.com/banksean/node-webfinger) implementation of banksean.


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
