/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 6/12/11
 * Time: 12:26 PM
 * To change this template use File | Settings | File Templates.
 */
function mix(o) {
    //Create o={} if not an object
    if (typeof o !== 'object') o = {};

    var obj = Array.prototype.slice.call(arguments, 1),
        i = 0, l = obj.length;

    //Iterate over each subsequent object and copy properties into o
    for (; i < l; i++) {
        for (var j in obj[i]) {
            if (obj[i].hasOwnProperty(j)) {
                o[j] = obj[i][j];
            }
        }
    }

    return o;
}
var mongoose = require('mongoose');
var Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;
var KeywordDensity = new Schema({
    word:{type:String,index:true},
    value:Number
})
var Mixin = {
    loc:Number,
    status:String,
    date:Date,
    tags:[],
    rating:String,
    notes:String,
    content:String,
    title:String,
    category:String,
    link:String,
    hash:String,
    insert_date:{type:Date,"default":Date.now}

}

var RatingMetricScore = new Schema({
    metric:String,
    value:Number

});
var Queue = new Schema({
    status:{type:String,"default":"waiting"},
    site:String,
    priority:Number,
    started_at:Date,
    finished_at:Date,
    loc:Number,
    url:String,
    extra:{}
});
//Queue.index({loc:1,site:1,priority:-1});
Queue.index({site:1,status:1,priority:-1});
var SiteRating = new Schema({
    loc:{type:Number,index:true},
    site:{type:String,index:true},
    date:{type:Date,"default":Date.now},
    metrics:[],
    score:Number
});


var Review = new Schema(mix({
    score:Number,
    identity:String

}, Mixin))


Review.index({loc:1,date:1,status:1,rating:1,site:1});

var Social = new Schema(mix({

    network:String, // indexed
    action:String,
    metric:String
}, Mixin));

var Metrics = new Schema({
    type:String,
    period:String,
    date:Date,
    aggregates:{}


});
Metrics.index({date:1,type:1,period:1});

exports.schemas = {
    industry:{
        Review:Review,
        /* Social:Social,*/
        Metrics:Metrics
    },
    dashboard:{
        Queue:Queue
    }



};



