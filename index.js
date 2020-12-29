/*
 * Primary file
*/

// dependencies
const { stat } = require('fs');
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

var server = http.createServer(function(req, res){
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
            'payload': buffer

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
});

server.listen(3000, function(){
    console.log("The server is listening on port 3000");
});


// define handlers
var handlers = {};
hendlers.sample = function(data, callback){
    // callback a http status code, and a payload object
    callback(406, {'name': 'sample hander'});
};

handlers.notFound = function(data, callback){
    callback(404);
};

// define a request router
const router = {
    'sample': handlers.sample
};
