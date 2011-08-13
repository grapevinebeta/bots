/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/13/11
 * Time: 2:55 AM
 */

var core = require('../core');

var methods = core.methods();
methods._parseRating = function($, data) {


    var doc = this.createDefaultRating();


    doc.score = this.float($("div.rating_box abbr").attr("title"));
    doc.count = this.int($("span.rateTxt span.count").text());

    return doc;
}
methods._parseComments = function($, data, page, callback) {
    var comments = [];
    var self = this;
    $("#ip_reviews_wrapper .hReview").each(function() {
        var $el = $(this);
        var identity = self.trim($el.find("a.reviewer").text());
        // make sure that we only pull comments from insiderpages.com and not patners
        if (!identity.match(/by [a-z]+ at/i)) {
            var comment = self.createDefaultComment();
            comment.score = self.float($el.find(".user_info abbr").attr("title"));
            comment.title = self.trim($el.find(".user_info span.summary").text());

            comment.identity = identity;
            comment.content = self.trim($el.find(".reviewDesc .description").text());
            comment.date = new Date($el.find(".reviewDesc .dtreviewed").attr("title"));
            if (self.check(comment)) {
                self.debug(comment);
                comments.push(comment);
            }
        }
    })
    callback(comments);
}
methods._page = function(page) {
    if (page == 1)return this._currentURL;
    var url = this._currentURL + "?page=" + page;

    return url;
}
methods._hasMore = function($, data, page) {
    //this.debug("_hasMore", page, $("div.pagination a.next_page").length);

    return $("div.pagination a.next_page").length


}

exports.job = core.job.extend({debug:false,site:"insiderpages.com",methods:methods}, {
    input: ["http://www.insiderpages.com/b/9432965094/tom-benson-chevrolet-san-antonio"]

});
