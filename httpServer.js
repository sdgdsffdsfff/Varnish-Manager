var http = require("http");
var events = require("events");
var fs = require('fs');
var path = require('path');
var url = require('url');

var mine = require("./mine.js").types;
var varnishManager = require("./App/varnishManager");

var server = new http.Server();

server.on("request",function(req,res){

	var lowerUrl = req.url.toLowerCase(); 

	if(!lowerUrl){res.writeHead(200,{"Content-Type":"text/plain"}); res.end(); return;}

	if(lowerUrl.indexOf("/web") == 0){
		var pathName = url.parse(req.url).pathname;
		var realPath = path.join(".", pathName);
		var ext = path.extname(realPath);
    	ext = ext ? ext.slice(1) : 'unknown';


		fs.exists(realPath,function(exists){
			if(!exists){
				res.writeHead(404, {
                'Content-Type': 'text/plain'
	            });

	            res.write("This request URL " + realPath + " was not found on this server.");
	            res.end();
			}
			else {
				fs.readFile(realPath,"binary",function(err,file){
					if(err){
						res.writeHead(500, {
                        'Content-Type': 'text/plain'
	                    });
	                    res.end(err);
					}
					else{
						var contentType = mine[ext] || "text/plain";
	                    res.writeHead(200, {
	                        'Content-Type': contentType
	                    });
	                    res.write(file, "binary");
	                    res.end();
					}
				})
			}
		});
	}
	else if(lowerUrl.indexOf("/app")==0){
		res.writeHead(200, {
			'Content-Type': 'application/json'
		});

		varnishManager.ProcessHandle(req, function(err, data ){
			if(!err){
				res.write(data);
				res.end();
			}
			else{
				//log()
				res.end();
			}
		});
	}
})

server.listen(7812);
console.log("HTTP SERVER is LISTENING AT PORT 7812.")