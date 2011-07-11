/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/10/11
 * Time: 11:52 PM
 * To change this template use File | Settings | File Templates.
 */
var comments = {
    "comments":{
        defaults:{
            points:0,
            count:0
        },
        counters:{
            points:"score",
            count:1
        }
    },
    "scoreboard":{
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
        counters:{
            rating:{
                negative:function(comment, doc) {
                    return comment.score < 3 ? 1 : 0;
                },
                positive:function(comment, doc) {
                    return comment.score >= 4 ? 1 : 0;
                },
                neutural:function(comment, doc) {
                    return comment.score >= 3 && comment.score < 4 ? 1 : 0
                },
                points:"score",
                count:1
            },
            reviews:function(comment) {
                return 1;
            }
        }

    }
}

var rating = {

}
exports = {
    comments:comments,
    rating:rating
}