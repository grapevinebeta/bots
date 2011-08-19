/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 8/13/11
 * Time: 6:38 PM
 */
var core = require('../core');

var methods = core.methods();
methods.init();
methods._parseRating = function($, data) {


    var doc = this.createDefaultRating();
    var html = $(data);

    // site is on a out of 10 scale, we put it to a 5 point scale
    doc.score; //parseInt($("span.average").text(), 10) / 2;

    doc.rating;// = $("span.average").text();
    doc.count;// = $("span.count").text();

    return doc;
}
methods._parseComments = function($, data, page, callback, scope) {
    var comments = [];
    var self = this;

    var html = $(data);
    var $el;
    var comment
    html.find(".yls-dt-reviews li").each(function() {
        $el = $(this);
        comment = self.createDefaultComment();
        comment.identity = $el.find(".reviewer em").text();
        comment.score = self.float($el.find("i.rating"));
        comment.content = self.trim($el.find("blockquote.summary").text());
        comment.title = comment.content.length > 40 ? comment.content.substr(0, 40) + '...' : comment.content;
        comment.date = new Date($el.find("abbr.dtreviewed").text());
        if (self.check(comment)) {
            comments.push(comment);
        }
    })
    callback.call(scope, comments);
}
methods._page = function(page) {
    return this._currentURL;
}
methods._hasMore = function($, data, page) {
    return false;


}
methods._save = function() {
    console.log(this._comments.length);
}
methods.init();

exports.job = core.job.extend({debug:false,site:"",methods:methods}, {
    input: ["http://local.yahoo.com/info-19266582-lulus-bakery-cafe-san-antonio"],
    run:function(url) {
        url += "?tab=reviews&allreviews=1";
        core.job.run.call(this, url);
    }


});
