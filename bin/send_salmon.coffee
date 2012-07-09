#!/usr/bin/env coffee

fs = require('fs')
request = require('request')
Salmon = require('../lib/ostatus').salmon;


if process.argv.length isnt 5
    console.error "Usage: #{process.argv[0]} #{process.argv[1]} <atom.xml> <private.key> <http://salmon/endpoint>"
    process.exit 1

# Load parameters
atomPayload = fs.readFileSync process.argv[2]
privKey = fs.readFileSync process.argv[3]
salmonEndpoint = process.argv[4]

# Sign & prepare envelope
envelope = "<?xml version='1.0' encoding='UTF-8'?>\n" +
    Salmon.signEnvelopeXML(atomPayload, privKey).toString()
console.log 'Generated envelope: ' + envelope

# Send envelope via HTTP
opts =
    method: 'POST'
    uri: salmonEndpoint
    body: envelope
    headers:
        'Content-Type': 'application/magic-envelope+xml'

request opts, (error, response, body) ->
    if error
        console.error error.message
        return
    if response.statusCode is 200
        console.log body
    else
        console.error response.statusCode
        console.log body

