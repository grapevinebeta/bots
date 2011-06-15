/**
 * Created by JetBrains PhpStorm.
 * User: cideasdev
 * Date: 6/12/11
 * Time: 10:43 AM
 * To change this template use File | Settings | File Templates.
 */
console.log(require.paths);
var nodeio = require('node.io');

var mongoose = require('mongoose');
var ENV = process.env.NODE_ENV;
var config = require("../config/auto").config[ENV];
var schemas = require("../config/schemas").schemas;
mongoose.connect(config.mongodb);
var cityhash = require("./../modules/cityhash.node");
for (var schema in schemas) {
    mongoose.model(schema, schemas[schema]);
}


var Mixin = {};


Mixin._more = true;

Mixin._comments = [];

Mixin._rating = {};

Mixin._site = null;

Mixin.logger = require('log4js')().getLogger();
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
            console.log(err);
        }
        self._currentPage = parseInt(page);
        args.unshift(page);

        self._parseHandler.apply(self, args);
        if (callback != null)
            callback.apply(scope)
    });
}

Mixin._parseHandler = function(page, err, $, data, headers) {
    this.debug("Getting page : " + page);
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
        this._comments.concat(this._parseComments($, data, page));
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


    for (var i in this._comments) {
        this._comments[i].save();
    }

    this._rating.save();
    this._comments = [];
    this.emit("finished :" + this._currentURL);
}
Mixin._hash = function(obj) {
    var str = null;
    if (obj instanceof this._db.model("Comment")) {

        str = [obj.site,obj.date,obj.identity].join("|") // hash from site.host|comment.date|comment.commiter - indexed

    }
    return cityhash.hash64(str, "cideas", "grapevine").value;
}
Mixin.debug = function() {
    this.logger.debug.apply(this.logger, Array.prototype.slice.call(arguments));
}
Mixin.check = function(obj) {
    obj.uuid = this._hash(obj);
    if (obj.uuid != this._lastHash) {
        return true;
    }
    this.debug("finished!!!");
    return this._more = false;


}

exports.mixin = Mixin;

exports.job = new nodeio.Job({
    run:function(url) {
        // since node.io only copies the core functions when
        // forking an job instance we must mixin the methods
        if (!this.mixin) {
            nodeio.utils.put(this, Mixin);
            this.mixin = true;
        }
        var self = this;
        this._more = true;

        this._currentURL = url;
        this._fetchLastHash(function(hash) {
            this.debug("fetchLastHash.complete");
            this._lastHash = hash;
            this._get(1);
        }, this);
    }
});

//console.log(Job.prototype);

