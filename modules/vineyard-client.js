/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/15/11
 * Time: 8:12 AM
 */
var request = require('request');

var ENV = process.env.NODE_ENV || "dev";
var CONFIG = require("../config/auto")[ENV];

function call(method, endpoint, body, callback, scope) {
    request({
        method:method,
        uri:CONFIG.blackbox + endpoint,
        body:body,
        json:true
    }, function(err, response, body) {

        callback.call(scope, body);
    });
}

["social","review"].forEach(function(name) {
    var _endpoint = "/" + name;
    exports[name] = {
        fetch:function(type, callback, scope) {
            call("GET", _endpoint, {
                type:type
            }, callback, scope);
        },
        store:function(type, data, callback, scope) {
            call("POST", _endpoint, {
                type:type,
                data:data
            }, callback, scope);
        }
    }
});



