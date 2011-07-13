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

var core = require('../core');


var methods = core.methods();

methods._parseRating = function($, data) {


    var doc = this.createDefaultRating();


    // site is on a out of 10 scale, we put it to a 5 point scale
    doc.score = parseInt($("span.average").text(), 10) / 2;

    doc.rating = $("span.average").text();
    doc.count = $("span.count").text();
    this.debug(doc);
    return doc;
}
/**
 * @inherit
 *
 */
methods._parseComments = function($, data, page) {
    var comments = [];
    var self = this;


    $("div.hreview").each(function() {
        if (self._more) {
            self.debug("fetching comments");
            var comment = self.createDefaultComment();

            comment.date = new Date($("span.value-title", this).attr("title"));
            comment.content = $("span.description", this).text();


            comment.identity = $(".reviewer", this).text();
            if (self.check(comment)) {
                // self.density(comment)


                var matches = $('.userReviewTopRight script', this).text().match(RATING_REGX);


                for (var i in METRICS) {
                    comment.metrics.push({
                        metric:METRICS[i],
                        value:parseInt(matches[i], 10)
                    });
                }

                var matches = $('.userReviewTopRight img', this).attr("src").match(/rating-([0-9]+).png/);
                // self.debug(matches);
                comment.score = parseInt(matches[1], 10);


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
methods._page = function(page) {
    return page == 1 ? this._currentURL : this._currentURL + "page" + page;
}
methods._hasMore = function($, data) {
    try {

        return $('h3 a').attr("href").match(new RegExp("\/page" + (this._currentPage + 1) + "\/")) ? true : false;

    } catch(e) {
        return false;
    }


}

exports.job = core.job.extend({debug:false,site:"dealerrater.com",methods:methods}, {
    input: ["http://www.dealerrater.com/dealer/Tom-Williams-BMW-review-187/"]

});




