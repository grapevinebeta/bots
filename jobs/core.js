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
var request = require('request');

Mixin._more = true;

Mixin._comments = [];

Mixin._rating = {};


//Mixin.logger = require('log4js')().getLogger();
/**
 * @mongoose
 */



/**
 * Fetchs last Comment.uuid that was processed
 * @param callback
 * @param scope
 */
Mixin._fetchLastHash = function(callback, scope) {
    callback.call(scope);

    /*var Comment = this._db.model("Comment");
     this.debug("fetchLashHash.start");
     var self = this;

     var regex = new Regexp(["^[0-9]+",this.locationId(),this.site(true)].join("-"));
     Comment.findOne({"_id":regex}, {"_id":1}, function(err, c) {
     // TODO error checking
     c = c || {uuid:""};

     self.debug("LastHash for [" + self._site + "] =" + c.uuid);

     callback.call(scope, c.uuid);

     });*/
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
    return {
        location_id:this.locationId(),
        site:this.site(),
        date:Date.now(),
        score:0
    }

}
/**
 * @return DefaultComment
 */
Mixin.createDefaultComment = function() {

    return{
        //month-day-year-location-site-hash
        _id:null, // hash from site.host|comment.date|comment.commiter - indexed
        score:null,
        identity:null,
        metrics:[],
        location_id:this.locationId(),
        site:this.site(),
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


        if (err) {
            throw er;
            console.log(err);
            return;
        }

        jsdom.env({
            html: data,
            scripts: [
                'http://code.jquery.com/jquery-1.5.min.js'
            ]
        }, function (err, window) {


            if (err) {

                return
            }
            self._currentPage = parseInt(page);


            var finish = function() {
                if (callback != null)
                    callback.apply(scope)
            }

            self._parseHandler.apply(self, [page,window.jQuery,data,finish]);


        });

    });
}

Mixin._parseHandler = function(page, $, data, callback) {


    var self = this;
    if (page == 1) {
        this._rating = this._parseRating($, data);

        var begin = function(comments) {
            self._comments = comments;
            slurp.call(self);
        }


        var slurp = function() {
            if (this._more && this._hasMore($, data, page)) {
                this._get(++page, slurp, this);
            } else {
                this._save();
            }

        }
        this._parseComments($, data, page, begin);


    }
    else {
        var concat = function(comments) {
            self._comments = self._comments.concat(comments);
            callback();
        }
        this._parseComments($, data, page, concat);

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
Mixin.blackbox = function(method, endpoint, body, callback) {
    request({
        method:method,
        uri:CONFIG.blackbox + endpoint,
        body:body,
        json:true
    }, callback)
}
Mixin.int = function(val) {
    val = parseInt(val, 10);
    if (isNaN(val))
        val = 0;
    return val;
}
Mixin.float = function(val) {
    val = parseFloat(val);
    if (isNaN(val))
        val = 0;
    return val;
}
Mixin.trim = function(val) {
    return this.filter(val).trim().replace(/“|”|â€œ|â€/g, '"').replace(/\r\n/g, "\n");
}
Mixin._save = function() {


    var i = 0;
    var len = this._comments.length;
    var self = this;

    this.blackbox("POST", "/reviews",
            {
                locationId:this.locationId(),
                site:this.site(),
                rating:this._rating,
                comments:this._comments
            }, function(err, response, body) {
                self._comments = [];
                self._rating = null;
                self.emit("finished :" + self._currentURL);
            })


}
Mixin._hash = function(obj) {
    var str = null;
    var month = obj.date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    var date = obj.date.getDate();
    if (date < 10) {
        date = "0" + date;
    }
    var prefix = [month,date,obj.date.getFullYear(),obj.locationId,obj.site].join("-");

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
Mixin.locationId = function(id) {
    if (id) {
        this._locationId = id;
    }
    return this._locationId;
}
Mixin.site = function(domainOnly) {
    return this.options.site;
}

Mixin.more = function() {
    return this._more;
}

exports.methods = function() {
    return nodeio.utils.put({}, Mixin);
}
exports.job = new nodeio.Job({


    input:function(start, num, callback) {
        var self = this;
        Mixin.blackbox("GET", "/queue", {site:this.options.site},
                function(err, response, body) {
                    if (body && body.hasOwnProperty("url")) {
                        self.locationId(body.location_id);

                        callback(body.url)
                    }
                });

    },


    run:function(url) {


        // since node.io only copies the core functions when
        // forking an job instance we must mixin the methods
        if (!this.mixin) {
            this.options.spoof = true;
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

