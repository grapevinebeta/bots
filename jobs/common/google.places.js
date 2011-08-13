/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 8/13/11
 * Time: 4:05 PM
 */
var core = require('../core');

var REQUIRED_PARAMS = {
    view:"feature",
    mcsrc:"google_reviews",
    num:20,
    start:0
};
var methods = core.methods();
var _url = require("url");
methods.init();
methods._parseRating = function($, data) {


    var doc = this.createDefaultRating();
    var html = $(data);
    var score = html.find("#pp-headline-details .rsw-pp-widget:first div:first").attr("g:rating_override");
    score = this.float(score).toFixed(2);

    // site is on a out of 10 scale, we put it to a 5 point scale
    doc.score = score; //parseInt($("span.average").text(), 10) / 2;

    doc.rating;// = $("span.average").text();
    doc.count;// = $("span.count").text();

    return doc;
}
methods._parseComments = function($, data, page, callback, scope) {
    var comments = [];
    var self = this;

    var html = $(data);
    var $el;


    html.find("#pp-reviews-container div.pp-story-item").each(function() {
        if (!self.more()) return;
        $el = $(this);
        var comment = self.createDefaultComment();
        comment.identity = $el.find(".pp-review-author span").text();
        if (!comment.identity) {
            comment.identity = "Guest";
        }
        comment.date = new Date($el.find(".date:last").text());
        comment.title = $el.find(".review span.title").text();
        // screw you google, add the numbers like everyone else does, stop being special
        comment.score = ($el.find(".rsw-half-starred").length * .5) + $el.find(".rsw-starred").length;

        // google breaks up the review content plus adds inline css which gets
        // picked up with jquery.. luckly they wrapped each section nicely.. HA
        comment.content = comment.title + $el.find(".snippet").text();
        if (self.check(comment)) {
            comments.push(comment);
        }

    })

    callback.call(scope, comments);


}
methods._page = function(page) {
    if (page == 1)
        return this._currentURL;
    // 2-1= 1, 1*20 = 20,
    this._query["start"] = (page - 1) * REQUIRED_PARAMS.num;
    return make_url(this._query);
}
methods._hasMore = function($, data, page) {
    var next = this.int($(data).find("#navbar a .nr").text());
    if (next && next != page)return true;
    return false;


}
methods._save = function() {
    this.debug(this._comments);
    //this.debug("Comments", this._comments.length);
}

exports.job = core.job.extend({debug:false,site:"google.places.com",methods:methods}, {
    input: [

        "http://maps.google.com/maps/place?cid=7512427536523652810&q=best+chevrolet,+kenner,+la&gl=us&ved=0CBAQ-gswAA&sa=X&ei=441FTv-KGZquywW4yfSlCA"

    ],
    run:function(url) {

        // store url object for easy use in _page
        this._query = _url.parse(url, true).query;


        for (var key in REQUIRED_PARAMS) {
            this._query[key] = REQUIRED_PARAMS[key];
        }
        //delete this._urlObj["href"];


        url = make_url(this._query);


        core.job.run.call(this, url);

    }
});
function make_url(query) {
    return "http://maps.google.com/maps/place?" + require("querystring").stringify(query);
}


