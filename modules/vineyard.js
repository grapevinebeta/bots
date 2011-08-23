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


var Schemas = require(__dirname + "/../config/schemas").schemas;

var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;


var ObjectId = function(str) {
    var oid = Schema.Types.ObjectId;
    var o = new oid("_id");
    return o.cast(str);
}

var _connections = {};
function get_db(config, schemas) {
    config = config || Config;
    schemas = schemas || "dashboard";
    var uri = config.get("mongodb");
    var db
    if (!_connections[uri]) {
        db = mongoose.createConnection(uri);
        for (var schema in Schemas[schemas]) {
            db.model(schema, Schemas[schemas][schema]);
        }
    } else {
        db = _connections[uri];
    }

    return db;
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

    try {
        var a_comments = get_aggregators(options.industry).comments;


        if (options.comments && options.comments.length) {


            var comments = options.comments;
            var comment;
            for (var i in comments) {
                comment = comments[i];

                a_comments.process(comment.loc, comment);


            }

            a_comments.flush(true);
        }
    } catch(e) {
        console.log(e);
    }

    callback({ok:true});

}
var _configs = {};
function get_config(industry) {
    if (!_configs[industry]) {
        _configs[industry] = new ConfigClass(industry);
    }

    return _configs[industry];
}
function get_aggregators(industry) {


    var industry_config = get_config(industry);
    var db = get_db(industry_config, "industry");
    var comments = new Aggregator(db, "comments", industry_config);
    // var ratings = new Aggregator(db, "rating", config);
    return {
        comments:comments

    };


}


exports.reviews.description = "Yummy comments, all for me";

exports.social = function(options, callback) {

}

exports.social.description = "nasty social...";

exports.queue = function(options, callback) {

    var db = get_db();
    var QueueClass = db.model("Queue");


    if (!options.finished) {
        var queue = new QueueClass();
        queue.collection.findAndModify({site:options.site,status:"waiting"},
            [
                ["priority","ascending"]

            ],
            {"$set":{status:"processing",started_at:new Date()}},
            {new:true},

            function(err, doc) {

                callback(doc);
            }

        );
    } else {


        var id = ObjectId(options.id);
        QueueClass.collection.update({_id:id}, {"$set":{status:"finished",finished_at:new Date()}}, function() {
            db.close();
        });


        callback({ok:true});
    }


}

exports.aging = function(options, callback) {


    var db = get_db(get_config(options.industry), 'industry');

    var ModelClass = db.model(options.type == "comments" ? 'Comment' : 'Social');


    ModelClass.findOne({loc:options.loc,site:options.site},
        function(err, doc) {

            callback({id:(doc || {}).hash});
        }).sort({"insert_date":-1});


}
exports.restful = true;
exports.aging.description = "Figure out the oldest social/review entry for a giving industry and location";
function updateQueue(query, fields) {
    var QueueClass = GlobalDB.model("Queue");
    var queue = new QueueClass();
    queue.collection.findAndModify(query,
        {"$set":fields}
    );
}
exports.queue.description = "Drink some wine but you have to spit it back out";