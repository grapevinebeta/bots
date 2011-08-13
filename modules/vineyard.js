/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/10/11
 * Time: 10:45 PM
 * To change this template use File | Settings | File Templates.
 */
this.title = "Eat everything tell nothing";
this.name = "vineyard";
this.version = "0.1.0";
this.endpoint = "http://localhost:8080";
var ENV = process.env.NODE_ENV || "dev";

var density = require("../modules/keyworddensity");
density = new density.KeywordDensity();

var Aggregator = require('./aggregator').Aggregator;


var mongoose = require('mongoose')


var CONFIG = require("../config/automotive").config[ENV];
var schemas = require("../config/schemas").schemas;


for (var schema in schemas) {
    mongoose.model(schema, schemas[schema]);
}
var db = mongoose.connect(CONFIG.mongodb);

var CommentAggregator = new Aggregator(db, "comment");
var RatingAggregator = new Aggregator(db, "rating");
var Queue = db.model("Queue");
var q = new Queue();
q.url = "http://www.dealerrater.com/dealer/Tom-Williams-BMW-review-187/";
q.site = "dealrrater.com";
//q.save();
var ACCESS_TOKEN = "145634995501895|2.AQDwNSDnf5WycG-E.3600.1310691600.0-100001852399680|oRgzH-LoB2L2F83OaBScBiIGarA";
exports.facebook = function(options, callback) {
    var fb = require("../jobs/social/facebook");
    var context = new fb.FacebookContext(ACCESS_TOKEN, "last week");
    context.start(function(docs) {
        callback({docs:docs});
    });
}
exports.reviews = function(options, callback) {

    CommentAggregator.reset();
    RatingAggregator.reset();
    var commentDate,date,path;

    var metrics = db.collection("metrics");
    var locationId = options.location_id;

    if (options.rating) {

        RatingAggregator.process(locationId, options.rating);

        RatingAggregator.commitSet(metrics);


    }

    if (options.comments && options.comments.length) {


        var updates = {};
        for (var i in options.comments) {
            var comment = new CommentClass(options.comments[i]);
            var keywords = density.getDensity(comment.content, 2);


            CommentAggregator.process(comment.loc, comment);


        }
        CommentAggregator.commitInc(metrics);
    }

    callback("ok");

}
exports.reviews.description = "Yummy comments, all for me";

exports.social = function(options, callback) {

}

exports.social.description = "nasty social...";

exports.queue = function(options, callback) {

    var QueueClass = db.model("Queue");
    var queue = new QueueClass();

    if (!options.finished) {
        queue.collection.findAndModify({status:"fresh",site:options.site},
                [
                    ["priority","ascending"]

                ],
                {"$set":{processed:"processing",started:new Date()}},

                function(err, doc) {
                    callback({job:doc});
                }

        );
    } else {
        queue.collection.findAndModify({"_id":options.id},
                {"$set":{status:"finished",finished:new Date()}}
        );
    }

}