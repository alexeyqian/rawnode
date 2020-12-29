/*
 * Primary file
*/

// dependencies
const http = require('http');
const url = require('url');

var server = http.createServer(function(req, res){
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');
    const method = req.method.toLowerCase();

    res.end('Hello world\n');
    console.log('request received on path: ' + trimmedPath + ' with method: ' + method);
});

server.listen(3000, function(){
    console.log("The server is listening on port 3000");
});



