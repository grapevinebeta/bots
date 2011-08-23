var configs =
{
    tokens:{
        dev:{
            database:"mongodb://localhost",
            app:"http://grapevine.localhost",
            vineyard:"http://localhost"

        },
        prod:{
            database:"mongodb://localhost",
            vineyard:"http://localhost"
        }
    },
    globals:{


        webhooks:"{app}/webhooks",
        vineyard:"{vineyard}:8081",
        mongodb:"{database}/dashboard"


    },


    automotive:{
        mongodb:"{database}/automotive"
    },
    hospitality:{
        mongodb:"{database}/hospitality"
    },
    restaurant:{
        mongodb:"{database}/restaurant"
    }

}
var request = require('request');
var cityhash = require("./../modules/cityhash.node");
var ENV = process.env.NODE_ENV || "dev";
var Config = function(industry, env) {

    industry = industry || "globals";
    env = env || ENV;
    this._tokens = configs.tokens[env];
    this._config = configs[industry];
    this._globals = configs.globals;
    this._cache = {};
    console.log("Created config : ", industry);


}
Config.prototype.epoch = function() {
    return new Date(1970, 0, 1, 0, 0, 0, 0);
}
Config.prototype.formatDate = function(date) {
    if (typeof date == "string") {
        date = new Date(date);
    }

    var month = date.getMonth() + 1;
    if (month < 10)
        month = "0" + month.toString();
    var day = date.getDate();
    if (day < 10) {
        day = "0" + day.toString();
    }
    var year = date.getFullYear();
   /* var hours = date.getHours();
    if (hours < 10) {
        hours = "0" + hours;
    }
    var min = date.getMinutes();
    if (min < 10) {
        min = "0" + min;
    }*/
    return [month,day,year].join("-");
}
Config.prototype.get = function(key) {
    if (this._cache[key])return this._cache[key];
    var value = this._config[key] || this._globals[key];

    if (value.indexOf("{") != -1) {
        var self = this;
        value = value.replace(/\{([a-z]+)\}/ig, function(dummy, token) {
            if (self._tokens[token]) {
                return self._tokens[token];
            }
        });
    }
    this._cache[key] = value;
    return value;
}
Config.prototype.webhook = function(uri, body) {

    this.request({
        method:"POST",
        uri:this.get("webhooks") + uri,
        json:body
    }, function() {

    });
}
Config.prototype.request = function(options) {
    request(options);
}
Config.prototype.hash = function(obj) {

    var str = null;
    var month = obj.date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    var date = obj.date.getDate();
    if (date < 10) {
        date = "0" + date;
    }
    var site = obj.site.replace(".com", "");
    var prefix = [[month,date,obj.date.getFullYear()].join(""),obj.loc,site].join("-");

    var str = prefix + [obj.site,obj.date,obj.identity].join("|");// hash from site.host|comment.date|comment.commiter - indexed


    var hash = cityhash.hash64(str, "cideas", "grapevine").value;
    return /*prefix + ":" + */hash;
}
Config.prototype.queue = function(body, callback) {
    this.vineyard("GET", "/queue", body, callback);
}
Config.prototype.uri = function(where, endpoint) {
    return this.get(where) + endpoint;
}
Config.prototype.vineyard = function(method, endpoint, body, callback) {

    this.request({
        method:method,
        uri:this.get("vineyard") + endpoint,
        body:body,
        json:true
    }, callback);
}

exports.Config = Config;