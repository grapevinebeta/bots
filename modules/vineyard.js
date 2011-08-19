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


var ConfigClass = require(__dirname + "/../config/config").Config;
var Aggregator = require(__dirname + '/aggregator').Aggregator;
var Config = new ConfigClass("globals");


var schemas = require(__dirname + "/../config/schemas").schemas;


var GlobalDB = require('mongoose').connect(Config.get("mongodb"));
for (var schema in schemas.dashboard) {
    GlobalDB.model(schema, schemas.dashboard[schema]);
}


var ACCESS_TOKEN = "145634995501895|2.AQDwNSDnf5WycG-E.3600.1310691600.0-100001852399680|oRgzH-LoB2L2F83OaBScBiIGarA";
exports.facebook = function(options, callback) {
    var fb = require("../jobs/social/facebook");
    var context = new fb.FacebookContext(ACCESS_TOKEN, "last week");
    context.start(function(docs) {
        callback({docs:docs});
    });
}

exports.reviews = function(options, callback) {

    var aggregators = this.init(options.industry);
    var a_comments = aggregators.comments;
    var a_ratings = aggregators.ratings;


    var locationId = options.location_id;

    /*  if (options.rating) {

     a_ratings.process(locationId, options.rating);

     a_ratings.set();


     }*/

    if (options.comments && options.comments.length) {


        var updates = {};
        for (var i in options.comments) {
            var comment = options.comments[i];

            a_comments.process(comment.loc, comment);


        }
        a_comments.inc(metrics);
    }

    callback("ok");

}
function _init(industry) {

    if (!this._aggregators[industry]) {
        var config = new Config(industry);
        var db = require('mongoose').connect(config.get("mongodb"));
        for (var schema in schemas.industry) {
            db.model(schema, schemas.industry[schema]);
        }
        var comments = new Aggregator(db, "comment", config);
        var ratings = new Aggregator(db, "rating", config);
        this._aggregators[industry] = {
            comments:comments,
            ratings:ratings
        };
    }


    return this._aggregators[industry];
}
exports.reviews.init = _init;


exports.reviews.description = "Yummy comments, all for me";

exports.social = function(options, callback) {

}

exports.social.description = "nasty social...";

exports.queue = function(options, callback) {

    var QueueClass = GlobalDB.model("Queue");
    var queue = new QueueClass();

    if (!options.finished) {
        queue.collection.findAndModify({status:"waiting",site:options.site},
            [
                ["priority","ascending"]

            ],
            {"$set":{status:"processing",started_at:new Date()}},
            {new:true},

            function(err, doc) {
                callback({job:doc});
            }

        );
    } else {
        queue.collection.findAndModify({"_id":options.id},
            {"$set":{status:"finished",finished_at:new Date()}}
        );
    }

}
exports.queue.description = "Drink some wine but you have to spit it back out";