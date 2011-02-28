node-ostatus
============

An implementation of the [OStatus](http://ostatus.org) protocol stack for node.js

*** Ongoing development on the master branch until I reach a first stable 0.1 release ***

Copyright (C) 2010 Laurent Eschenauer <laurent@eschenauer.be>

Install
-------

If you are using npm (the node packet manager), installing is as easy as:
    npm install ostatus


Dependencies
------------

If you are using this from source, you can install the dependencies using npm from the root of the source folder:
    npm bundle

Or you can install all dependencies manually:
- [node](http://nodejs.org/) v4+ is required, I'm developing against trunk.
- [node-o3-xml](https://github.com/ajaxorg/node-o3-xml/)
- [Mu](https://github.com/raycmorgan/Mu/tree/v2) the v2 branch

Documentation
-------------

This is high on the todo list. For now, you'll have to look into the code to discover the API. You can also have a look at the command line tools to see some basic usages.

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

What is missing:

-  [salmon](http://www.salmon-protocol.org/)

Client
------

In the bin/ folder, you'll find a few simple command line clients for ostatus.

### Status
Display the last status update of someone:
	node ./bin/status.js evan@identi.ca
	2010-12-14T19:29:07+00:00
	RT @support Repetitive email notifications are fixed now. Our apologies for the inconvenience.     

### Profile
Display the profile of someone
	node ./bin/profile.js evan@identi.ca
	photo: http://avatar.identi.ca/1-96-20100903013814.jpeg
	nickname: evan
	fn: Evan Prodromou
	label: Montreal, Quebec, Canada
	url: http://evan.status.net/
	note: Montreal hacker and entrepreneur. Founder of identi.ca, lead developer of StatusNet, CEO of StatusNet Inc.

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
