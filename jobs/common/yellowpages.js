/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 8/13/11
 * Time: 5:28 PM
 */
var core = require(__dirname + '/../core');

var methods = core.methods();

methods._parseComments = function($, data, page, callback, scope) {
    var comments = [];
    var self = this;

    var html = $(data);
    var $el;
    html.find("#reviews-list li").each(function() {
        if (!self.more())return;
        $el = $(this);
        // omit other sponsers
        if (!$el.find(".review-provider span.YP").length) return;
        var comment = self.createDefaultComment();
        comment.identity = $el.find(".recent-review-byline a").text();


        var date = $el.find(".recent-review-byline").text().match(/\d+\/\d+\/\d+/).shift();

        comment.date = new Date(date);
        comment.score = self.float($el.find(".review-rating span").text().replace(/stars?/ig, ''));
        comment.title = $el.find("h4").text();
        comment.content = self.trim($el.find(".review-text").text());
        comment.link = "http://www.yellowpages.com" + $el.find("a.respond-to-review").attr("href");
        if (self.check(comment)) {
            comments.push(comment);
        }

    });
    callback.call(scope, comments);
}
methods._page = function(page) {
    if (page == 1)
        return this._currentURL;
    page = this.page_template.replace("{page}", page);

    return page;
}
methods._hasMore = function($, data, page) {


    var last = this.int($(data).find("ol.track-pagination li:not(.next):last a").text());

    if (last && page + 1 <= last) return true;
    return false;//return .length ? true : false;


}

methods.init();

exports.job = core.job.extend({flatten:false,debug:false,site:"yellowpages.com",methods:methods}, {
    run:function(job) {


        this.debug("Starting Yellowpages.com");
        this.id = job.url.replace(/[^0-9]+/g, "");
        job.url = job.url + "/reviews?lid=" + this.id;
        this.page_template = job.url + "&page={page}";

        //http://www.yellowpages.com/kenner-la/mip/best-chevrolet-inc-21937087/reviews?lid=21937087
        core.job.run.call(this, job);
    }

});
