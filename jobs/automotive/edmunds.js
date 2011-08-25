/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/12/11
 * Time: 11:46 PM
 */
var core = require('../core');
var request = require("request");

var methods = core.methods();
methods._parseRating = function($, data) {


    var doc = this.createDefaultRating();

    var $sales = $("#dealerSaleRating");
    var $service = $("#dealerServiceRating");


    var sales = this.int($sales.find("span.rating-big").attr("title"));
    var service = this.int($service.find("span.rating-big").attr("title"));
    doc.score = (sales + service) / 2;

    // review counts
    sales = this.int($sales.find("span.count").text());
    service = this.int($service.find("span.count").text());

    doc.count = sales + service;

    return doc;
}
methods._parseComments = function($, data, page, callback, scope) {
    var comments = [];
    var self = this;
    var content;

    var html = $(data);
    var list = html.find(".sales-review-item,.service-review-item");
    var index = -1;
    var parse = function() {

        if (self.more() && (++index) < list.length) {
            self.debug("parsing :" + (index ), index, list.length);
            var $el = $(list.get(index));

            // omit older reviews block
            if (!$el.find("h2#sales_older_review_title,h2#service_older_review_title").length) {
                var comment = self.createDefaultComment();

                comment.date = new Date($el.find("span.dtreviewed").text());
                comment.score = self.float($el.find("span.rating-big").attr("title"));
                comment.title = $el.find(".sales-review-item-title,.service-review-item-title").text();
                comment.identity = $el.find("span.reviewer span.fn").text();

                content = $el.find("div.description p").text();

                content = self.filter(content.replace("Read the full review", "")).trim();

                // if not showing full comment fetch it
                if (content.indexOf('...') == content.length - 3) {

                    fullReview($el.find("div.description a").attr("href"),
                        comment, check, self);
                } else {
                    comment.content = content;
                    check(comment);
                }
            } else {
                parse();
            }
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
    var fullReview = function(url, comment, callback, scope) {

        request.get({uri:"http://www.edmunds.com" + url}, function(err, response, body) {
            comment.content = self.filter($("div.description p", body).text()).trim();

            callback.call(scope, comment);
        });
    }

    parse();
}
methods._page = function(page) {
    if (page == 1)return this._currentURL;
    var p = this._currentURL;

    if (p.match(/sales\.[0-9]+\.html/)) {
        p = p.replace(/sales\.[0-9]+\.html/, 'sales.' + page + ".html");
    } else {
        p = p.replace(/service\.[0-9]+\.html/, 'service.' + page + ".html");
    }
    // mantain the sort from newest to odest
    if (p.indexOf("?sorttype") == -1) {
        p += "?sorttype=createdate-desc";
    }
    this.debug(p);
    return p;


}
methods._hasMore = function($, data, page) {
    var hasMore = $("#page_" + (page + 1), data).length;
    this.debug("Has More :" + hasMore);
    return hasMore


}
/*methods._save = function() {
 this.emit("finished");
 }*/
methods.init("automotive");

exports.job = core.job.extend({debug:false,site:"edmunds.com",methods:methods}, {
    /* input: ["http://www.edmunds.com/dealerships/Texas/SanAntonio/TomBensonChevrolet/service.1.html"],*/
    run:function(job) {
        job.url = job.url.replace(/\?.+/, '');
        this.debug("URL : " + job.url + " : " + job.url.indexOf(".html"));
        if (job.url.indexOf(".html") == -1) {
            job.url += "service.1.html";
        }
        this.debug("NEW URL :: " + job.url);
        var url = job.url;
        if (!job.added) {
            this.debug("Adding new JOb");
            if (url.indexOf('service.1.html') == -1) {
                url = url.replace('service.1.html', 'sales.1.html');
            } else {
                url = url.replace('sales.1.html', 'service.1.html');
            }
            var newJob = {added:true};
            for (var i in job) {
                newJob[i] = job[i];
            }
            job.added = true;
            this.add(newJob);
        }

        core.job.run.call(this, job);
    }

});
