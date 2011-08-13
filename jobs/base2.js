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

var mongoose = require('mongoose');
var ENV = process.env.NODE_ENV;
var config = require("../config/automotive").config[ENV];
var schemas = require("../config/schemas").schemas;
mongoose.connect(config.mongodb);
var cityhash = require("./../modules/cityhash.node");
for (var schema in schemas) {
    mongoose.model(schema, schemas[schema]);
}
var jquery = require("jquery").create();
var KeywordDensity = require("../modules/keyworddensity").KeywordDensity
var density = new KeywordDensity();


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
    var hash = this._density(comment.contet, level);

    for (word in hash) {
        comment.keywords.push({word:word,count:hash[word]});
    }

}
Mixin._density = function(content, level) {
    return density.getDensity(content, level || 2);
}
Mixin.createDefaultRating = function() {
    var Rating = this._db.model("SiteRating");
    var doc = new Rating();
    doc.site = this._site;
    doc.location_id = this._locationId;
    return doc;
}
Mixin.createDefaultComment = function() {
    var Comment = this._db.model("Comment");
    var doc = new Comment();
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
    this.getHtml(this._page(page), function(err) {
        var args = Array.prototype.slice.call(arguments);
        if (err) {
            throw error;
            console.log(err);
            return;
        }
        self._currentPage = parseInt(page);
        args.unshift(page);

        self._parseHandler.apply(self, args);
        if (callback != null)
            callback.apply(scope)
    });
}

Mixin._parseHandler = function(page, err, $, data, headers) {
    $ = jquery;
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
    var slurp = function() {
        if (i < len) {
            console.log("saving");
            self._comments[i++].save(saved);
        } else {
            finished();
        }
    }
    var saved = function(err) {
        slurp()
    }
    var finished = function() {
        console.log("saved");
        self._rating.save(function(err) {
            self._comments = [];
            self._rating = null;
            self.emit("finished :" + self._currentURL);
        });

    }
    slurp();


}
Mixin._hash = function(obj) {
    var str = null;
    if (obj instanceof this._db.model("Comment")) {

        str = [obj.site,obj.date,obj.identity].join("|") // hash from site.host|comment.date|comment.commiter - indexed

    }
    return cityhash.hash64(str, "cideas", "grapevine").value;
}
Mixin.debug = function() {
    if (this.options.debug) {
        //  this.logger.debug.apply(this.logger, Array.prototype.slice.call(arguments));
    }
}
Mixin.transform = function(str) {
    return str.toLowerCase().replace(/[^a-z]+/g, "_");
}
Mixin.check = function(obj) {
    obj.uuid = this._hash(obj);
    if (obj.uuid != this._lastHash) {
        return true;
    }
    this.debug("finished!!!");
    return this._more = false;


}

Mixin.run = function(url) {
    var self = this;
    this._more = true;

    console.log(this);
    this.debug(url);
    this._currentURL = url;
    this._fetchLastHash(function(hash) {
        this.debug("fetchLastHash.complete");
        this._lastHash = hash;
        this._get(1);
    }, this);
}

exports.mixin = Mixin;

exports.job = new nodeio.Job({
    run:function() {
        
    }
});
exports.mix = function(a) {
    return  nodeio.utils.put({}, a, Mixin);
}

