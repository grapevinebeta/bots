var configs =
{
    automotive:{
        dev:{
            mongodb:"mongodb://localhost/automotive",
            vinyard:"http://localhost:8080"
        },
        prod:{
            mongodb:"mongodb://50.57.109.127/grapevine_auto"

        }
    }

}
var request = require('request');
var Config = function() {

}
Config.prototype.request = function(options) {
    request(options);
}
Config.prototype.vinyard = function(method, endpoint, body, callback) {

    this.request({
        method:method,
        uri:this._config.vinyard + endpoint,
        body:body,
        json:true
    }, callback);
}

exports.Config = function(industry, env) {
    this._config = configs[industry][env];

}