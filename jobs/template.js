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
methods._parseComments = function($, data, page,callback) {
    var comments = [];
    var self = this;

    var $el;
    callback(comments);
}
methods._page = function(page) {
    return this._currentURL;
}
methods._hasMore = function($, data,page) {
    return false;


}

exports.job = core.job.extend({debug:false,site:"",methods:methods}, {
    input: [""]

});
