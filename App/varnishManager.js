var http = require("http");
var events = require("events");
var util = require('util');
var request= require("request");
var url = require("url");
var querystring = require("querystring");

var varnish= require("./node-varnish")
var instanceConfig = require("./Config/InstanceConfig")


var connections = [];

var VarnishManager = function(){
	events.EventEmitter.call(this);  
}

util.inherits(VarnishManager, events.EventEmitter);

VarnishManager.prototype.GetAllServers = function(){
	return instanceConfig.GetAllServers();
}


VarnishManager.prototype.getParsedUrl = function(requestUrl, host, port){
	if (requestUrl.indexOf('http') !== 0) {
        requestUrl = 'http://' + requestUrl;
    };
    var urlInfo = url.parse(requestUrl);
    host = host || urlInfo.hostname;
    var ext = (urlInfo.port ? (':' + urlInfo.port) : "") + (urlInfo.pathname || "") + (urlInfo.query ? ("?" + urlInfo.query) : "");
    return {
        url: urlInfo.protocol + '//' + host + ':' + port + ext,
        host: urlInfo.hostname
    }
}

VarnishManager.prototype.ProcessHandle = function(req,callBack){

	if(!req || !req.url){return false;}

	var urlParse = url.parse(req.url);

	var pathname= urlParse.pathname;
	var query = urlParse.query;
	var destinationUrl = querystring.parse(query) &&  querystring.parse(query)["url"];
	var queryHost = querystring.parse(query) && querystring.parse(query)["host"];

	var destinationServer = instanceConfig.GetServerByName(queryHost);

	switch(pathname.toLowerCase()){
		case "/app/delete":
			return this.DeleteUrl(req,destinationUrl,destinationServer,callBack);
			break;
		case "/app/gethosts":
			return this.GetHosts(req);
			break;
		case "/app/purge":
			return this.Purge(destinationUrl,destinationServer,callBack);
			break;
		case "/app/checkserverstatus":
			return this.CheckServerStatus(req);
			break;
		case "/app/checkurl":
			return this.CheckUrl(req,destinationUrl,destinationServer,callBack);
			break;
		case "/app/configrender":
			return this.RenderConfig(callBack);
			break;
		default:
			return false;
			break;
	}
}


VarnishManager.prototype.CheckUrl = function(req, destinationUrl,destinationServer,callBack){
	
	var options = this.getParsedUrl(destinationUrl, destinationServer.host, destinationServer.httpPort);

	this.sendRequest(options,destinationServer.name,callBack);
}

VarnishManager.prototype.DeleteUrl = function(req, destinationUrl,destinationServer,callBack){
	
	var options = this.getParsedUrl(destinationUrl, destinationServer.host, destinationServer.httpPort);
	var serverID = destinationServer.name;

	request.del({
		url: options.url,
		headers:{
			"host":options.host,
			"User-Agent": 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
		}
	},function(error, response, body){
		var data ; 
		if(!error){
			data = {
				id:serverID,
				data:response.headers
			};
		}
		else{
			data = {
				id:serverID,
				data:error
			}
		}

		callBack(null,JSON.stringify(data));
	});
}



VarnishManager.prototype.RenderConfig= function(callBack){

	var config = instanceConfig.RenderConfig();

	var responseString = "";
	if(config){
		responseString = "var locations= " + JSON.stringify(config);
	}

	callBack(null,responseString);

}

VarnishManager.prototype.sendRequest= function(options, serverID,callBack){
	request.get({
		url: options.url,
		headers:{
			"host":options.host,
			"User-Agent": 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
		}
	},function(error, response, body){
		var data ; 
		if(!error){
			data = {
				id:serverID,
				data:response.headers
			};
		}
		else{
			data = {
				id:serverID,
				data:error
			}
		}

		callBack(null,JSON.stringify(data));
	});
}

VarnishManager.prototype.CheckServerStatus = function(){
	for(var i = 0; i < instanceConfig.GetAllServers().length ; i++){
		var client = new varnish.VarnishClient( instanceConfig.GetAllServers()[i].host, instanceConfig.GetAllServers()[i].port );
		client.on("ready",function(){
			client.run_cmd("status", function(){
				var data =(arguments && arguments.length >2 )?{
							"status":arguments[1],
							"content":arguments[2]
						}:{
							"status":-500,
							"contect":"no response from service"
						};
				vmInstance.emit('RECEIVE_DATA', data);
			})
		})
		
	}
}


VarnishManager.prototype.Purge= function(destinationUrl,server, callBack){
	
	var command = "ban req.url ~ "+url.parse(destinationUrl).path+" && req.http.host ~ "+url.parse(destinationUrl).host;

	var client = new varnish.VarnishClient( server.host, server.port, 'varnish' );
	client.on("ready",function(){
		client.run_cmd(command,function(){
			var data = {
				id:server.name,
				data:arguments
			};

			callBack(null,JSON.stringify(data));
		})
	})
}

VarnishManager.prototype.GetHosts= function(){}


var vmInstance = new VarnishManager();
module.exports = vmInstance;


