/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 6/9/11
 * Time: 11:34 PM
 * To change this template use File | Settings | File Templates.
 */

var METRICS = {
    1:"id",
    2:"customer_service",
    3:"quality_of_work",
    4:"friendless",
    5:"overall_experience",
    6:"price"
}
var RATING_REGX = /ratings([0-9]+)',\s([0-9]+),\s([0-9]+),\s([0-9]+),\s([0-9]+),\s([0-9]+)/;

var Base = require('base');


var Job = exports.job = Base.job.extend({
    input: ["http://www.dealerrater.com/dealer/Best-Chevrolet-review-1698/"]

});

Base.mixin._parseRating = function($, data) {
    var doc = this.createDefaultRating();


    doc.score = $("span.average").text;

    rating_doc.rating = $("span.average").text;
    rating_doc.count = $("span.count").text;
    return doc;
}
/**
 * @inherit
 *
 */
Base.mixin._parseComments = function($, data) {
    var comments = [];
    var self = this;
    $("div.hreview").each(function(div) {
        if (self.more()) {
            var comment = {
                date:new Date($("span.value-title", div).attribs.title),
                content:$("span.description", div).text,
                metrics:[]
            };
            var scores = $('.userReviewTopRight script', div).text;


            var matches = scores.match(RATING_REGX);
            for (var i in METRICS) {
                comment.metrics[METRICS[i]] = matches[i];
            }
            var matches = scores.match(/rating-([0-9]+).png/);
            comment.score = matches[1];
            if (self.check(comment)) {
                comments.push(comment);
            }
        }


    });
    return comments;
}
/**
 * @inherit
 *
 */
Base.mixin._page = function(page) {
    return page == 1 ? this._currentURL : this._currentURL + "page" + page;
}



