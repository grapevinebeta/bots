/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/14/11
 * Time: 1:05 AM
 */
var core = require('../core');
var ABBR = {
    Jan:"Janurary",
    Feb:"February",
    Mar:"March",
    Apr:"April",
    May:"May",
    June:"June",
    Jul:"July",
    Aug:"August",
    Sep:"September",
    Sept:"September",
    Oct:"October",
    Nov:"November",
    Dec:"December"
}
var methods = core.methods();
methods._parseRating = function($, data) {


    var doc = this.createDefaultRating();

    doc.score = $("#coreRating img").attr("src").match(/([0-9\.]+).png/)[0];
    doc.score = this.float(doc.score);


    doc.count = this.int($("#rdrwslnk strong").text().replace(/Reviews?/, ''));

    return doc;
}
methods._parseComments = function($, data, page, callback) {
    var comments = [];
    var self = this;

    var $el;


    $("div.reviewContainer:first .hreview").parent().each(function() {
        if (self.more()) {
            $el = $(this);
            var comment = self.createDefaultComment();
            var score;
            if ($el.find("#reviewRating img").length) {
                score = $el.find("#reviewRating img").attr("src");
                score = score.replace(/.*([0-9\.]+)_stars\.gif/, function(a, value) {
                    return self.float(value);
                });
            } else {
                score = self.float($el.find("span.rating").text());
            }
            comment.score = score;
            comment.identity = $el.find("#reviewBy a").text();
            // guest comment
            if (!comment.identity) {
                comment.identity = $el.find("#reviewBy").text().replace("by ", "");
            }
            var date = $el.find("#reviewDate").text();
            if (!date) {
                date = $el.find("abbr.dtreviewed").text();
            }
            date = date.split(" ");
            date[0] = ABBR[date[0]]; // translate abbr to full month;
            comment.date = new Date(date.join(" "));


            var $desc = $el.find("span.description");
            // more comment
            if (($desc.attr("id") || "").indexOf("ReviewLink") != -1) {
                // "more" comment is taged at theReviewText<num> where the number is found
                // on the description span as ReviewLink<num>
                $desc = $el.find("#" + $desc.attr("id").replace("ReviewLink", "theReviewText"));

            }

            comment.content = self.trim($desc.text().replace("(Hide)", ""));
            // since there is no title we fetch from content
            comment.title = comment.content.substr(0, 40) + "...";
            if (self.check(comment)) {
                comments.push(comment);
            }
        }

    });
    callback(comments);


}
methods._page = function(page) {
    if (page == 1) return this._currentURL;
    this.debug(this.next_page);
    return this.next_page;
}
methods._hasMore = function($, data, page) {
    //TODO : implement scraping page>1
    return false;
    var last = $("#pagingdiv a:last");

    if (last.text().indexOf("Next") != -1) {

        this.next_page = last.attr("href").replace(/.*(http[^']+).*/g, function(dummy, link) {
            // stupid bitches compress site
            link = link.replace(/\n/g, '');
            link = link.replace(/&amp;/g, "&");
            return link.replace(/%3D/g, '=');
        });
        return true;
    }
    return false;


}
methods._save = function() {
    this.debug("Comments", this._comments.length);
    this.debug(this._comments);
}

exports.job = core.job.extend({debug:false,site:"superpages.com",methods:methods}, {
    input: ["http://www.superpages.com/bp/San-Antonio-TX/Tom-Benson-Chevrolet-L0097625245.htm"]

});
