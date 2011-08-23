/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 8/20/11
 * Time: 9:54 AM
 */
require.paths.unshift("/usr/local/lib/node_modules");
var nodeio = require('node.io');


exports.job = new nodeio.Job({

    input:function(start, num, callback) {

        setTimeout(function() {
            var body = {
                url:"http://google.com",
                foo:"boo",
                bar:"bar"
            };
            callback([body]);
        }, 1000);

    },
    run:function(job) {
        console.log(job);
    }


})