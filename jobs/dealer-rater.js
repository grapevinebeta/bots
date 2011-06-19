/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 6/9/11
 * Time: 11:34 PM
 * To change this template use File | Settings | File Templates.
 */

var METRICS = {

    2:"customer_service",
    3:"quality_of_work",
    4:"friendless",
    5:"overall_experience",
    6:"price"
}
var RATING_REGX = /ratings([0-9]+)',\s([0-9]+),\s([0-9]+),\s([0-9]+),\s([0-9]+),\s([0-9]+)/;

var Base = require('base');


var Job = exports.job = Base.job.extend({debug:false},{
    input: ["http://www.dealerrater.com/dealer/Tom-Williams-BMW-review-187/"]

});

Base.mixin._site = "dealerrater.com";
Base.mixin._parseRating = function($, data) {

    
    var doc = this.createDefaultRating();


    // site is on a out of 10 scale, we put it to a 5 point scale
    doc.score = parseInt($("span.average").text,10)/2;

    doc.rating = $("span.average").text;
    doc.count = $("span.count").text;
    this.debug(doc);
    return doc;
}
/**
 * @inherit
 *
 */
Base.mixin._parseComments = function($, data, page) {
    var comments = [];
    var self = this;
    if (page != 1) {
        $("div.hreview");
    }
    [].concat($("div.hreview")).forEach(function(div) {
        if (self._more) {
            var comment = self.createDefaultComment();

            comment.timestamp = new Date($("span.value-title", div).attribs.title);
            comment.content = $("span.description", div).text;


            //console.log(self.density(comment.content, 2));
            var d = self.density(comment.content, 2)
            for (var i in d) {

                comment.keywords.push(d[i]);
            }
            comment.identity = $(".reviewer", div).text;
            if (self.check(comment)) {

                // console.log( $('.userReviewTopRight span', div).innerHTML);
                var matches = $('.userReviewTopRight script', div).text.match(RATING_REGX);
                for (var i in METRICS) {
                    comment.metrics.push(self.metric(METRICS[i], matches[i]));
                }

                var matches = $('.userReviewTopRight img', div).attribs.src.match(/rating-([0-9]+).png/);
                // self.debug(matches);
                comment.score = matches[1];


                self._comments.push(comment);

            }
        }


    });

    
}
/**
 * @inherit
 *
 */
Base.mixin._page = function(page) {
    return page == 1 ? this._currentURL : this._currentURL + "page" + page;
}
Base.mixin._hasMore = function($, data) {
    try {

        return $('h3 a').attribs.href.match(new RegExp("\/page" + (this._currentPage + 1) + "\/")) ? true : false;

    } catch(e) {
        return false;
    }


}




