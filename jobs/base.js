/**
 * Created by JetBrains PhpStorm.
 * User: cideasdev
 * Date: 6/12/11
 * Time: 10:43 AM
 * To change this template use File | Settings | File Templates.
 */
var nodeio = require('node.io');

var mongoose = require('mongoose');
var ENV = process.env.NODE_ENV;
var config = require("../config/auto").config[ENV];
var schemas = require("../config/schemas").schemas;
mongoose.connect(config.mongodb);
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
    this.logger.debug("fetchLashHash.start");
    Comment.findOne({site:this._site}, {uuid:1}, function(err, uuid) {
                // TODO error checking

                callback.call(scope, uuid);

            });
}

Mixin.createDefaultRating = function() {
    var Rating = this._db.model("Rating");
    var doc = new Rating();
    doc.site = this._site;
    doc.location_id = this._locationId;
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
    this.getHtml(this._page(page), function() {
        var args = Array.splice(arguments);
        args.unshift(page);
        self._parseHandler.apply(self, args);
        if (callback != null)
            callback.apply(scope)
    });
}

Mixin._parseHandler = function(page, err, $, data, headers) {
    if (page == 1) {
        this._rating = this._parseRating($, data);

        this._comments = this._parseComments($, data);

        var slurp = function() {
            if (this.more) {
                this._get(++page, slurp, this);
            } else {
                this._save();
            }
        }

        slurp.call(this);


    } else {
        this._comments.concat(this._parseComments($, data));
    }


}

Mixin._parseRating = function($, data) {

}

Mixin._parseComments = function($, data) {

}

Mixin._page = function(page) {

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

        this._currentURL = url;
        this._fetchLastHash(function(hash) {
            this.debug("fetchLastHash.complete");
            this._lastHash = hash;
            this._get(1);
        }, this);
    }
});

//console.log(Job.prototype);

