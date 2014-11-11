var instanceConfig =require("./instance.json");

console.log(instanceConfig);

instanceConfig.GetAllServers = function () {
    var data = [];
    for (var i = 0, instanceLength = this.length; i < instanceLength; i++) {
        var dataCenter = this[i].dataCenters;
        if (dataCenter) {
            for (var j = 0, dataCenterLength = dataCenter.length; j < dataCenterLength; j++) {
                var servers = dataCenter[j].servers;
                if (servers) {
                    for (var k = 0, serverLength = servers.length; k < serverLength; k++) {
                        servers[k] && data.push(servers[k]);
                    }
                }
            }
        }
    }

    return data;
}

instanceConfig.GetServerByName = function(name){

    for (var i = 0, instanceLength = this.length; i < instanceLength; i++) {
        var dataCenter = this[i].dataCenters;
        if (dataCenter) {
            for (var j = 0, dataCenterLength = dataCenter.length; j < dataCenterLength; j++) {
                var servers = dataCenter[j].servers;
                if (servers) {
                    for (var k = 0, serverLength = servers.length; k < serverLength; k++) {
                        if(servers[k].name == name){return servers[k];}
                    }
                }
            }
        }
    }

    return null;
}

instanceConfig.RenderConfig= function(){
    var dataCenters = this[0].dataCenters;

    return dataCenters.map(function(val,key){
        return  {
            name:val.name,
            servers:val.servers.map(function(server, serverKey){
                return {
                    name:server.name,
                    alive:0,
                    message:""
                }
            })
        }
    });

}

module.exports = instanceConfig
