/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/10/11
 * Time: 11:52 PM
 * To change this template use File | Settings | File Templates.
 */
var Config = require("./config").Config;
Config = new Config();
var comments = {
    "reviews":{
        by:"site", // hash by comment.site, this will create a sub hash of aggregates.{id}{site}=defaults
        overrall:true, // also store an overrall record which will have an date of epoch
        defaults:{
            points:0,
            count:0,
            site:"site",
            negative:0,
            positive:0,
            neutral:0
        },
        counters:{
            points:function(comment, doc) {
                return comment.score;
            },
            count:function(comment, doc) {
                return 1;
            },
            negative:function(comment) {
                return comment.score < 3 ? 1 : 0;
            },
            positive:function(comment, doc) {
                return comment.score >= 4 ? 1 : 0;

            },
            neutral:function(comment, doc) {
                return comment.score >= 3 && comment.score < 4 ? 1 : 0

            }
        }
    },
    "scoreboard":{
        overrall:true,
        defaults:{
            ogsi:0,
            rating:{
                negative:0,
                positive:0,
                neutral:0,
                points:0,
                count:0
            },
            reviews:0
        },
        finalize:function(db, comment, config) {

            if (comment.score <= 3) {
                comment.status = "alert";
            } else {
                comment.status = "new";
            }
            if (comment.score < 4) {
                // TODO send alert
                config.webhook('/alert', {
                    comments:[comment]
                })
            }
            var CommentClass = db.model("Comment");
            new CommentClass(comment).save();

        },
        counters:{
            rating:{
                negative:function(comment, doc) {
                    var value = comment.score < 3 ? 1 : 0;
                    if (value)
                        comment.rating = "negative";
                    return value;
                },
                positive:function(comment, doc) {
                    var value = comment.score >= 4 ? 1 : 0;
                    if (value)
                        comment.rating = "positive";
                    return value;
                },
                neutral:function(comment, doc) {
                    var value = comment.score >= 3 && comment.score < 4 ? 1 : 0
                    if (value) {
                        comment.rating = "neutral";
                    }

                    return value;
                },
                points:function(comment, doc) {
                    return comment.score;
                },
                count:function(comment, doc) {
                    return 1;
                }
            },
            reviews:function(comment) {
                return 1;
            }
        }

    }
}


var ratings = {
    ratings:{
        defaults:{
            score:0
        },
        counters:{
            score:"score"
        }
    }
}
exports = {
    comments:comments,
    ratings:ratings
}