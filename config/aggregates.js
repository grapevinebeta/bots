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
        by:function(comment) {
            return comment.site.replace(/\./g, '_');
        }, // hash by comment.site, this will create a sub hash of aggregates.{id}{site}=defaults
        overrall:true, // also store an overrall record which will have an date of epoch
        defaults:{
            points:0,
            count:0,
            negative:0,
            positive:0,
            neutral:0
        },
        counters:{
            site:function(comment) {
                return comment.site;
            },
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
        finalize:function(db, comments, config) {


            var comment;
            var to_send = [];
            var CommentClass = db.model("Comment");
            for (var i in comments) {
                comment = comments[i];
                if (comment.score < 3 && comment.score != 0) { // negative
                    comment.status = "alert";

                } else {
                    comment.status = "new";
                }

                to_send.push(comment)
                new CommentClass(comment).save();
            }

            if (to_send.length) {

                config.webhook('/emails/alerts', {
                    documents:to_send
                });
            }

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


exports.config = {
    comments:comments

}