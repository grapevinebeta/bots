/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/13/11
 * Time: 5:50 AM
 */
var core = require('../core');
var PAGE_AMOUNT = 40;
var methods = core.methods();
methods._parseRating = function($, data) {


    var doc = this.createDefaultRating();
    var html = $(data);

    doc.score = this.float(html.find("#bizRating .star-img img").attr("title").replace(/[^0-9\.]+/g, ''));

    doc.count = this.int(html.find("#bizRating .review-count .count").text());

    return doc;
}
methods._parseComments = function($, data, page, callback, scope) {
    var comments = [];
    var self = this;

    $(data).find("ul li.review").each(function() {

        if (!self.more())return;
        var $el = $(this);
        var comment = self.createDefaultComment();
        comment.identity = $el.find("li.user-name a").text();
        comment.date = new Date($el.find("em.dtreviewed span").attr("title"));
        comment.content = self.trim($el.find("p.review_comment").text());
        comment.link = "http://www.yelp.com" + $el.find('a.linkToThis').attr("href");
        // since there isnt a title for yelp we will substr some of the content
        comment.title = comment.content.substr(0, 30) + "...";
        comment.score = self.float($el.find("div.rating .star-img img").attr("title").replace(/[^0-9\.]/g, ""));
        if (self.check(comment)) {
            comments.push(comment);
        }


    });
    callback.call(scope, comments);
}
methods._page = function(page) {
    if (page == 1)
        return this._currentURL;
    return this.page_template.replace("{start}", (page - 1) * PAGE_AMOUNT);

}
methods._hasMore = function($, data, page) {
    var anchor = $("#paginationControls table a:last", data);
    if (!anchor.length)return false;
    return this.int(anchor.text()) != page;


}
methods._save = function() {
    this.debug("Comments", this._comments.length);
}

exports.job = core.job.extend({debug:false,site:"yelp.com",methods:methods}, {
    input: ["http://www.yelp.com/biz/kings-court-frankfurter-express-san-antonio"],
    run:function(url) {
        this.page_template = url + "?rpp=" + PAGE_AMOUNT + "&sort_by=relevance_desc&start={start}";
        core.job.run.call(this, url);
    }

});
