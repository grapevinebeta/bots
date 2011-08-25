/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/13/11
 * Time: 3:50 AM
 */
var SECONDS = {
    DAY:86400,
    MONTH:2629743.83,
    YEAR:31556926
}
var core = require(__dirname + '/../core');

var methods = core.methods();

methods._parseRating = function($, data) {


    var doc = this.createDefaultRating();


    // site is on a out of 10 scale, we put it to a 5 point scale
    doc.score = this.float($(".rv_reviewInfo span[property='v:average']").text());


    doc.count = this.float($(".rv_reviewInfo span[property='v:count']").text());

    return doc;
}
methods._parseComments = function($, data, page, callback, scope) {
    var comments = [];
    var self = this;
    var html = $(data);
    var list = html.find("#ctl00_PlaceHolderMain_jbReviewGridview tr");
    var length = list.length;
    var index = -1;

    var parse = function() {
        if (self.more() && (++index) < length) {
            var $el = $(list.get(index));

            // omit partner entries
            var $name_date = $el.find('span a[href*="/members/"]:not([class="sp_reviewTitle_link"]):not([rel="nofollow"])').parent();
            if (!$name_date.length)return parse();
            var identity = $name_date.find("a").text();

            // omit partner entries
            if (identity.match(/by [\w]+ at/i))return parse();


            var comment = self.createDefaultComment();

            comment.identity = identity;

            comment.title = self.trim($el.find("a.sp_reviewTitle_link").text());

            var $content_link = $el.find("span a[href*='/posts/']").parent();
            var content = self.trim($content_link.text().replace("More >", ""));


            // fetch full comment
            var more_link = $("a", $content_link).attr("href").replace(/\.\.\//g, '');
            more_link = "http://www.judysbook.com/" + more_link;
            fetch_full_comment(comment, more_link, check);

        } else {
            callback.call(scope, comments);
        }

    }
    var check = function(comment) {
        if (self.check(comment)) {

            comments.push(comment);

        }
        parse();
    }

    var fetch_full_comment = function(comment, url, callback) {
        self.debug("Full Comment", url);
        self.get(url, function(err, body) {
            //  self.debug(body.indexOf("ctl00_PlaceHolderMain_ReviewDetail1_lblReviewDate"));
            //var matches = body.match(/ctl00_PlaceHolderMain_ReviewDetail1_lblReviewDate[^>]+>(.?)</);
            var $el = $(body);
            //self.debug($el.find("#ctl00_PlaceHolderMain_ReviewDetail1_lblReviewDate"));
            comment.date = new Date($el.find("#ctl00_PlaceHolderMain_ReviewDetail1_lblReviewDate").text());
            comment.content = self.trim($el.find("#ctl00_PlaceHolderMain_ReviewDetail1_lblReviewContent").text());
            comment.score = self.float($el.find("#ctl00_PlaceHolderMain_ReviewDetail1_jbRating_currRating").attr("value"));
            callback(comment);

        });
    }

    parse();

}
methods._page = function(page) {
    if (page == 1) {
        return this._currentURL;
    }
    var url = this.page_template.replace("{page}", "p" + page + "/t1");

    return url;
}
methods._hasMore = function($, data, page) {

    var found = $("td.PagerOtherPageCells a[title^='Show Result']:last", data);
    if (found.length) {
        var max = this.int(found.text());
        return max != page;
    }

    return false;


}

methods.init("automotive");

exports.job = core.job.extend({debug:false,site:"judysbook.com",methods:methods}, {
    /* input: ["http://www.judysbook.com/cities/sanantonio-tx/Auto-Parts/27802712/Tom_Benson_Chevrolet.htm"],*/
    run:function(job) {
        this.id = job.url.replace(/[^0-9]+/g, "");
        this.page_template = job.url.replace(/([0-9]+)/, "$1/{page}");

        core.job.run.call(this, job);

    }

});
