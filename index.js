/*
 * Primary file
*/

// dependencies
const { stat } = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const _data = require('./lib/data');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

const httpServer = http.createServer(function(req, res){
        unifiedServer(req,res);
});

httpServer.listen(config.httpPort, function(){
    console.log("The server is listening on port " + config.httpPort);
});

const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, function(req, res){
    unifiedServer(req, res);
});
httpsServer.listen(config.httpsPort, function(){
    console.log("The server is listening on port " + config.httpsPort);
});


const unifiedServer = function(req, res){
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');
    const method = req.method.toLowerCase();
    const queryStringObject = parsedUrl.query;
    const headers = req.headers;

    const decoder = new StringDecoder('utf-8');
    // Since the data is a stream, the server pget pieces of data and triggers the data event.
    // So we bufferred them and assemble them when server get notified it's the end of the data stream    
    // the data event will not get called if there is no payload.
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });

    // this end event tell us when request is done and it's always get called at the end of the request.
    req.on('end', function(){
        buffer += decoder.end();

        // choose the handler this request should go to.
        const chosenHandler = typeof(router[trimmedPath]) != 'undefined' ? router[trimmedPath] : handlers.notFound;
        // construct the data object to the handler
        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)

        };

        // handle the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload){
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};
            payloadString = JSON.stringify(payload);

            //return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            //console.log('request received on path: ' + trimmedPath + ' with method: ' + method);
            //console.log('query: ' + queryStringObject);
            console.log('return this payload back: ', payloadString);    
        });
    });
};

// define a request router
const router = {
    'ping': handlers.ping,
    'users': handlers.users
};
