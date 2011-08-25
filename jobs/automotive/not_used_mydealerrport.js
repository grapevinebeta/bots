/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 6/18/11
 * Time: 12:05 PM
 * To change this template use File | Settings | File Templates.
 */
var mapping = {
    BuyProcessBar:"buying_process",
    SaleAssoc:"sales_associate",
    VehicleSelecBar:"vehicle_selection",
    FinanceDepBar:"finance_department",
    TradeInBar:"trade_in_process"

}


var urlparse = require("url").parse;


var core = require('../core');


var methods = core.methods();

methods._parseRating = function($, data) {


    var html = $(data);

    var doc = this.createDefaultRating();
    doc.score = this.int(html.find(".showRating").text()) / 2; // normalize to a 5 point scale
    this.debug(doc);

    var self = this;
    var metric_key;
    var metric_value;
    var metric_regex = /ComenzarCargaBarra\('([a-z]+)',([0-9.]+)\)/i;
    /* html.find(".tableFullReportRight script").each(function() {

     matches = $(this).html().match(metric_regex);

     metric_key = matches[1];
     self.debug(metric_key);

     if (mapping[metric_key]) {
     metric_key = mapping[metric_key];
     metric_value = (self.filter(matches[2]).toInt() / 100) * 5;// normalize to a 5 point scale
     doc.metrics.push({
     metric:metric_key,
     value:metric_value});

     }


     });*/


    return doc;
}

methods._parseComments = function($, data, page) {
    var comments = [];
    var self = this;

    var content;
    var html = $(data);
    //TODO add error checking
    var isComment = false;
    html.find("tr div.datafullreport").each(function() {
        if (!self._more)return;
        var comment = self.createDefaultComment();

        $("div", this).each(function() {

            isComment = false;
            var el = $(this);
            var span = el.find("span.titfullreport");
            content = span.html();
            var table = false;
            if (!content) {
                // if span wasn't found which is for {user} and {date}
                // then check for if its a comment
                content = el.find("span.datafullreport").html();
                if (!content) {
                    table = el.find("table");
                    if (!table.length)
                        return;
                }

                isComment = true;
            }
            if (table) {
                $("tr", table).each(function() {// itr over each section
                    var metric_key = null,metric_value = null;
                    var done = false;
                    $("td", this).each(function() {// each piece that builds up the metric
                        if (done)return;
                        el = $(this);
                        if (el.hasClass("ratingName")) {
                            metric_key = self.transform(el.text());
                        } else if (el.hasClass("ratingNA")) {
                            metric_value = 'na';
                            if (metric_key) {
                                done = true;
                            }
                        } else if (el.find("td:first").attr("width")) {
                            // fetch with
                            metric_value = el.find("td:first").attr("width");
                            // transform to 100 point scale and divide by 20 to get to 5 point scale
                            metric_value = self.float(metric_value) / 20;
                            done = true;
                        }
                        if (done) {
                            comment.metrics.push(
                                {
                                    metric:metric_key,
                                    value:metric_value
                                });
                        }


                    })
                });
            } else if (content.indexOf("User:") != -1) {

                comment.identity = self.filter(el.text().replace("User:", "")).trim();
            } else if (content.indexOf("Date:") != -1) {

                var date = self.filter(el.text().replace("Date:", '')).trim();

                comment.date = new Date(date);

            } else if (isComment) {
                comment.content = self.filter(content).trim();


            }


        });

        if (self.check(comment)) {

            comments.push(comment);

        }


    });
    this.debug(comments);
    return comments;


}
methods._page = function(page) {
    return this._currentURL;
}
methods._hasMore = function($, data) {
    // displays all comments on single page
    return false;


}
methods._save = function() {
    this.debug(this._comments);
}

exports.job = core.job.extend({debug:false,site:"mydealerreport.com",methods:methods}, {
    input: ["http://mydealerreport.com/fullReport.php?DealerID=6841"],
    run:function(url) {
        this.id = urlparse(url, true).query.DealerID;

        core.job.run.call(this, url);
    }

});
