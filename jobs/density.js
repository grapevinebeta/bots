/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 6/17/11
 * Time: 10:42 PM
 * To change this template use File | Settings | File Templates.
 */

var nodeio = require("node.io");

var KeywordDensity = require("../modules/keyworddensity").KeywordDensity;
var density = new KeywordDensity();
exports.job = new nodeio.Job({
    input:["http://www.pearanalytics.com/blog/"],
    run:function(url) {
        this.get(url, function(err, data) {
            console.log("lalala");
            var d=density.getDensity(data, 2)
            console.log();
        });
    }
})