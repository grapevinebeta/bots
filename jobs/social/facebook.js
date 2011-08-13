/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/14/11
 * Time: 3:21 AM
 */
require.paths.unshift("/usr/local/lib/node_modules");
var APP_ID = "127267200694729";
var APP_SECRET = "7f335cc39d4113e38a4bf7fd206e2ffd";

var ACCESS_TOKEN = "145634995501895|2.AQDwNSDnf5WycG-E.3600.1310691600.0-100001852399680|oRgzH-LoB2L2F83OaBScBiIGarA";

var nodeio = require('node.io');
var fb = require("facebook-js");
var blackbox = require("blackbox-client");
function doc() {
    return {
        metric:null,
        action:null,
        network:null,
        _id:null, // hash from site.host|comment.date|comment.commiter - indexed
        score:null,
        identity:null,
        location_id:null,
        site:null,
        date:null,
        content:'',
        title:'',

        link:''
    }

}
function log() {
    console.log(Array.prototype.slice.call(arguments));
}
function FacebookContext(token, uid, since) {
    this.token = token || AUTH_TOKEN;
    this.uid = uid || '128686358822';//'hotelcontessa';
    this.site = "facebook.com";
    this.network = "facebook";
    this.since = since || "yesterday";
    this.bundle = {
        counters:{
            comment_likes:0,
            page_likes:0
        },
        docs:[]
    }


}
FacebookContext.prototype.activity = function(action) {
    return this._doc("activity", action);
}
FacebookContext.prototype.reach = function(action) {
    return this._doc("reach", action);
}
FacebookContext.prototype._doc = function(metric, action) {
    var d = doc();
    d.metric = metric;
    d.network = this.network;
    d.action = action;
    d.site = this.site;
    return d;
}

FacebookContext.prototype.start = function(callback) {


    var self = this;
    var index = 0;
    var step = function() {

        switch (++index) {
            case 1:
                this.feed(step, this);
                break;

            default:
                blackbox.store('facebook', this.bundle, function() {
                    callback();
                });

        }

    }
    step.call(this);


}
FacebookContext.prototype.feed = function(query, callback, scope) {
    if (typeof query == "function") {
        if (typeof callback != "undefined" && typeof callback != "function") {
            scope = callback;
        }
        callback = query;
        query = {}
    }
    this.r("/feed", query, function(err, response, body) {


        body.data.forEach(function(entry) {
            // process message doc
            this.feedEntry(entry);
        }, this);

        /*  if (body.data.paging && body.data.paging.next) {
         var query = require("url").parse(body.data.paging.next, true).query;
         log(query);
         this.feed(query, callback, scope);
         } else {
         callback.call(scope);
         }*/
        callback.call(scope);
    }, this);
}

FacebookContext.prototype.feedEntry = function(entry, type) {
    var identity = entry.from && entry.from.id != this.uid ? entry.from.name : null;
    var owner = entry.from && entry.from.id == this.uid;
    var social;
    type = entry.type || type;

    // status,link
    if (!owner) {
        var social = this.activity(type);

        if (type != "likes") {
            social.content = entry.message;
            social.identity = identity;
            //TODO since we are doing since yesterday we need to offset this a bit
            social.date = entry.created_time ? new Date(entry.created_time) : new Date();


            if (entry.name) {
                social.title = entry.name;
            } else {
                social.title = social.content.length > 50 ? social.content.substr(0, 50) + "..." : social.content;

            }
            if (entry.link) {
                social.link = entry.link;
            }
        } else {
            social.score = entry.count;
        }
    }
    if (type != "likes") {
        if (entry.likes) {
            this.bundle.counters.comment_likes += entry.likes.count;
        }

        if (entry.comments && entry.comments.count) {
            entry.comments.data.forEach(function(comment) {
                this.feedEntry(comment, "comment");
            }, this);
        }
    }
    if (social) {
        this.bundle.docs.push(social);
    }


}
FacebookContext.prototype.isActivity = function(type) {
    switch (type) {
        case "status":
            return true;
            break;
    }
    return false;
}
FacebookContext.prototype.r = function(uri, params, callback, scope) {
    var tmp = function(error, response, body) {

        callback.call(scope, error, response, body);
    }

    if (typeof params == "function") {
        if (typeof callback != "undefined" && typeof callback != "function") {
            scope = callback;
        }
        callback = params;
        params = {};
    }
    params.access_token = this.token;
    if (!params.since)
        params.since = this.since;
    if (this.uid) {
        uri = "/" + this.uid + uri;
    } else {
        uri = "/me" + uri;
    }

    fb.apiCall('GET', uri, params, tmp);
};

var request = function(uri, params, callback) {


}
var job = new nodeio.Job({
    input:function(start, num, callback) {
        blackbox.fetch('facebook', function(json) {
            if (json.job) {
                callback(json.job.toString());
            } else {
                callbak(false);
            }

        });
    },
    run:function(url) {
        var j = JSON.parse(url);
        var context = new FacebookContext(j.token, j.uid, j.since);
        context.start(function() {
            this.emit("finished :", j.uid);
        }, this);
    }


})
exports.job = job;
exports.FacebookContext = FacebookContext;

