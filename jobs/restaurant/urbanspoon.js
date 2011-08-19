/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 8/14/11
 * Time: 3:22 PM
 */
// NOTES
/**
 * Really Likes It = 5 star
Likes It = 4 Star
Doesn't Like it = 2 Star
Really Doesn't It = 1 Star
 */


var core = require('../core');

var methods = core.methods();
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
    callback(comments);
}
methods._page = function(page) {
    return this._currentURL;
}
methods._hasMore = function($, data, page) {
    return false;


}

exports.job = core.job.extend({debug:false,site:"",methods:methods}, {
    input: [""]

});
