/**
 * Created by JetBrains PhpStorm.
 * User: cideasdev
 * Date: 6/12/11
 * Time: 10:43 AM
 * To change this template use File | Settings | File Templates.
 */

require.paths.unshift("/usr/local/lib/node_modules");
console.log(require.paths);
var nodeio = require('node.io');
var ENV = process.env.NODE_ENV || dev;
var CONFIG = require("../config/auto")[ENV];


var cityhash = require("./../modules/cityhash.node");

var jsdom = require("jsdom");


var Mixin = {};


Mixin._more = true;

Mixin._comments = [];

Mixin._rating = {};

Mixin._site = null;

//Mixin.logger = require('log4js')().getLogger();
/**
 * @mongoose
 */

Mixin._db = mongoose;

/**
 * Fetchs last Comment.uuid that was processed
 * @param callback
 * @param scope
 */
Mixin._fetchLastHash = function(callback, scope) {
    var Comment = this._db.model("Comment");
    this.debug("fetchLashHash.start");
    var self = this;
    this.debug(Comment);
    Comment.findOne({site:this._site}, {uuid:1}, function(err, c) {
        // TODO error checking
        c = c || {uuid:""};

        self.debug("LastHash for [" + self._site + "] =" + c.uuid);

        callback.call(scope, c.uuid);

    });
}
/**
 *
 * @param {Comment} comment
 * @param level
 */
Mixin.density = function(comment, level) {
    /* var hash = this._density(comment.contet, level);

     for (word in hash) {
     comment.keywords.push({word:word,count:hash[word]});
     }*/

}
Mixin._density = function(content, level) {
    // return density.getDensity(content, level || 2);
}
Mixin.createDefaultRating = function() {
    var Rating = this._db.model("SiteRating");
    var doc = new Rating();
    doc.site = this._site;
    doc.location_id = this._locationId;
    return doc;
}
/**
 * @return DefaultComment
 */
Mixin.createDefaultComment = function() {

    var doc = {
        //month-day-year-location-site-hash
        _id:null, // hash from site.host|comment.date|comment.commiter - indexed
        score:null,
        identity:null,
        metrics:[],
        location_id:null,
        site:'',
        status:'',
        date:null,
        keywords:[] ,
        tags:[],
        notes:'',
        content:'',
        title:'',
        category:'',
        link:''

    }

    doc.site = this._site;
    doc.location_id = this._locationId;
    return doc;
}
Mixin.metric = function(metric, value) {
    var RatingMetricScore = this._db.model("RatingMetricScore");
    var doc = new RatingMetricScore();
    doc.metric = metric;
    doc.value = value;
    return doc;

}
/**
 * Fetches a giving page
 * @param page
 * @param callback
 * @param scope
 */
Mixin._get = function(page, callback, scope) {
    var self = this;
    this.get(this._page(page), function(err, data) {
        var args = Array.prototype.slice.call(arguments);
        if (err) {
            throw error;
            console.log(err);
            return;
        }
        jsdom.env({
            html: data,
            scripts: [
                'http://code.jquery.com/jquery-1.5.min.js'
            ]
        }, function (err, window) {

            self._currentPage = parseInt(page);
            args.unshift(page);

            self._parseHandler.apply(self, [page,window.jQuery,data]);
            if (callback != null)
                callback.apply(scope)

        });

    });
}

Mixin._parseHandler = function(page, $, data) {

    if (page == 1) {
        this._rating = this._parseRating($, data);

        this._comments = this._parseComments($, data, page);

        var slurp = function() {
            if (this._more && this._hasMore($, data)) {
                this._get(++page, slurp, this);
            } else {
                this._save();
            }

        }

        slurp.call(this);


    }
    else {
        this._comments = this._comments.concat(this._parseComments($, data, page))
    }


}

Mixin._parseRating = function($, data) {

}

Mixin._parseComments = function($, data) {

}
Mixin._hasMore = function($) {
    return false;
}

Mixin._page = function(page) {

}
Mixin._save = function() {


    var i = 0;
    var len = this._comments.length;
    var self = this;
    var options = {
        host:CONFIG.blackbox,
        port:80,
        path:"/reviews",
        method:"POST"

    }
    var request = require('request');
    request({
        method:"POST",
        uri:CONFIG.blackbox,
        body:{
            locationId:this._locationId,
            site:this._site,
            rating:this._rating,
            comments:this._comments
        },
        json:true
    }, function(err, response, body) {
        self._comments = [];
        self._rating = null;
        self.emit("finished :" + self._currentURL);
    });


}
Mixin._hash = function(obj) {
    var str = null;
    var month = obj.date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    var prefix = [month,obj.date.getDate(),obj.date.getFullYear(),obj.locationId,obj.site].join("-");

    var str = prefix + [obj.site,obj.date,obj.identity].join("|");// hash from site.host|comment.date|comment.commiter - indexed


    var hash = cityhash.hash64(str, "cideas", "grapevine").value;
    return prefix + ":" + hash;
}
Mixin.debug = function() {
    if (this.options.debug) {
        console.log(Array.prototype.slice.call(arguments));
        // this.logger.debug.apply(this.logger, Array.prototype.slice.call(arguments));
    }
}
Mixin.transform = function(str) {
    return str.toLowerCase().replace(/[^a-z]+/g, "_");
}
Mixin.check = function(obj) {
    obj._id = this._hash(obj);
    if (obj._id != this._lastHash) {
        return true;
    }
    this.debug("finished!!!");
    return this._more = false;


}


exports.methods = function() {
    return nodeio.utils.put({}, Mixin);
}
exports.job = new nodeio.Job({


    run:function(url) {


        // since node.io only copies the core functions when
        // forking an job instance we must mixin the methods
        if (!this.mixin) {
            nodeio.utils.put(this, this.options.methods);
            this.mixin = true;
        }
        var self = this;
        this._more = true;


        this.debug(url);
        this._currentURL = url;
        this._fetchLastHash(function(hash) {
            this.debug("fetchLastHash.complete");
            this._lastHash = hash;
            this._get(1);
        }, this);
    }
});

//console.log(Job.prototype);

