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
    loc:{type:Number,index:true},
    status:String,
    date:Date,
    keywords:[KeywordDensity] ,
    tags:[],
    notes:String,
    content:String,
    title:String,
    category:String,
    link:String

}

var RatingMetricScore = new Schema({
    metric:String,
    value:Number

});
var Queue = new Schema({
    processed:{type:Boolean,"default":false},
    site:String,
    priority:Number,
    started:Date,
    locationId:Number,
    url:String
});
Queue.index({processed:1,site:-1});
var SiteRating = new Schema({
    location_id:{type:Number,index:true},
    site:{type:String,index:true},
    date:{type:Date,"default":Date.now},
    metrics:[RatingMetricScore],
    score:Number
});


var Comment = new Schema(mix({
    score:Number,
    identity:String,
    metrics:[RatingMetricScore]
}, Mixin));
var Social = new Schema(mix({

    network:String, // indexed
    action:String,
    metric:String
}, Mixin));

var Metrics = new Schema({

    name:String,
    period:String,
    start_date:Date,
    aggregates:{}


});
Metrics.index({name:1,period:1,start_date:1});

exports.schemas = {
    RatingMetricScore:RatingMetricScore,
    SiteRating:SiteRating,
    Comment:Comment,
    Social:Social,
    KeywordDensity:KeywordDensity,
    Queue:Queue
};



