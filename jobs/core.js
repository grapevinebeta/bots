/**
 * Created by JetBrains PhpStorm.
 * User: cideasdev
 * Date: 6/12/11
 * Time: 10:43 AM
 * To change this template use File | Settings | File Templates.
 */

require.paths.unshift("/usr/local/lib/node_modules");
console.log(require.paths);

var nodeio = require('node.io');


var Mixin = {};


Mixin._more = true;

Mixin._comments = [];

Mixin._rating = {};


//Mixin.logger = require('log4js')().getLogger();
/**
 * @mongoose
 */



/**
 * Fetchs last Comment.uuid that was processed
 * @param callback
 * @param scope
 */
Mixin._fetchLastHash = function(callback, scope) {


    this.vineyard('GET', '/aging', {
        loc:this.locationId(),
        site:this.site(),
        industry:this.industry(),
        type:"comments"
    }, function(body) {

        callback.call(scope, body.id);
    });


}

Mixin.createDefaultRating = function() {
    return {
        location_id:this.locationId(),
        site:this.site(),
        date:Date.now(),
        score:0
    }

}
/**
 * @return DefaultComment
 */
Mixin.createDefaultComment = function() {

    return{
        //month-day-year-location-site-hash

        hash:null,// hash from site.host|comment.date|comment.commiter - indexed
        score:null,
        identity:null,
        loc:this.locationId(),
        site:this.site(),
        status:'',
        date:null,
        keywords:[] ,
        tags:[],
        notes:'',
        content:'',
        title:'',
        category:'',
        link:''

    }

}

/**
 * Fetches a giving page
 * @param page
 * @param callback
 * @param scope
 */
Mixin._get = function(page, callback, scope, retry) {
    var self = this;
    retry = retry || 0;

    var process = function(err, data) {
        this._currentPage = parseInt(page);
        var finish = function() {
            if (callback != null)
                callback.apply(scope)
        }
        if (err) {
            // most cases this will be an 404 error
            if (retry < 2) { // check with retrys
                if (err == 500 && retry) {
                    return self._get(page, callback, scope, retry++);
                }

            }


            return finish();
        }


        //this.$("body").html();

        this._parseHandler(page, this.jquery, data, finish);


    }
    this.get(this._page(page), function() {
        process.apply(self, arguments);
    });
}

Mixin._parseHandler = function(page, $, data, callback) {


    var self = this;
    if (page == 1) {
        // this._rating = this._parseRating($, data);

        var begin = function(comments) {
            self._comments = comments;
            slurp.call(self);
        }


        var slurp = function() {
            if (this._more && this._hasMore($, data, page)) {
                this._get(++page, slurp, this);
            } else {
                this._save();
            }

        }
        this._parseComments($, data, page, begin);


    }
    else {
        var concat = function(comments) {
            self._comments = self._comments.concat(comments);
            callback();
        }
        this._parseComments($, data, page, concat);

    }


}

Mixin._parseRating = function($, data) {

}

Mixin._parseComments = function($, data) {

}
Mixin._hasMore = function($) {
    return false;
}

Mixin._page = function(page) {

}

Mixin.int = function(val) {
    val = parseInt(val, 10);
    if (isNaN(val))
        val = 0;
    return val;
}
Mixin.float = function(val) {
    val = parseFloat(val);
    if (isNaN(val))
        val = 0;
    return val;
}
Mixin.trim = function(val) {
    return this.filter(val).trim().replace(/“|”|â€œ|â€/g, '"').replace(/\r\n/g, "\n");
}
Mixin._save = function() {


    this.debug("SAVING");
    var i = 0;
    var len = this._comments.length;
    var self = this;
    console.log("Comments Count : " + len);

    var commit = function() {
        self.vineyard('POST', '/queue', {
            id:self._job.id,
            finished:true
        }, function(body) {

            self._comments = [];
            self._rating = null;
            self.emit("finished :" + self._currentURL);
        });
    }
    if (!len) {
        commit();
        return;
    }
    this.vineyard("POST", "/reviews",
        {
            loc:this.locationId(),
            site:this.site(),
            industry:this.industry(),
            comments:this._comments
        }, function(body) {
            commit();

        })


}
/**
 * Comutes an hash for the object
 * @param obj
 */


/*Mixin.debug = function() {
 if (this.options.debug) {
 console.log(Array.prototype.slice.call(arguments));
 // this.logger.debug.apply(this.logger, Array.prototype.slice.call(arguments));
 }
 }*/
Mixin.transform = function(str) {
    return str.toLowerCase().replace(/[^a-z]+/g, "_");
}
Mixin.check = function(obj) {
    obj.hash = this.Config.hash(obj);
    if (obj.hash != this._lastHash) {
        return true;
    }
    this.debug("finished!!!");
    return this._more = false;


}
Mixin.locationId = function(id) {
    if (id) {
        this._locationId = id;
    }
    return this._locationId;
}
Mixin.site = function(domainOnly) {
    return this.options.site;
}
Mixin.industry = function(i) {
    if (i) {
        this._industry = i;
    }
    return this._industry;
}

Mixin.more = function() {
    return this._more;
}
Mixin._run = function(job) {

    var self = this;
    this._job = job;
    this.locationId(job.loc);
    this.industry(job.industry);

    var url = job.url;
    var runner = function(url) {
        //  this.$("body").html("");
        this._more = true;


        this.debug(url);
        this._currentURL = url;
        this._fetchLastHash(function(hash) {
            this.debug("fetchLastHash.complete");
            this._lastHash = hash;
            this._get(1);
        }, this);
    }
    if (!this.jquery) {
        var jsdom = require("jsdom"),
            window = jsdom.jsdom().createWindow();
        jsdom.jQueryify(window, 'http://code.jquery.com/jquery-1.4.2.min.js', function() {
            self.jquery = window.$;
            //window.$('body').append('<div class="testing">Hello World, It works</div>');
            runner.call(self, url);
        });
    } else {
        runner.call(this, url);
    }
}

var Config = require(__dirname + '/../config/config').Config;
var GlobalConfig = new Config();
Mixin.init = function(industry, env) {


    this.Config = new Config(industry, env);
}
exports.methods = function() {
    return nodeio.utils.put({}, Mixin);
}
var query = require('querystring');
Mixin.vineyard = function(method, endpoint, body, callback) {
    var url = GlobalConfig.uri("vineyard", endpoint);
    var parse = function(err, body) {

        if (body) {
            try {
                body = JSON.parse(body);
            } catch(e) {
                body = {};
            }
            callback(body);
        }

    }

    if (method == 'GET') {
        body = query.stringify(body);
        url += "?" + body;
        this.get(url, parse);
    } else {
        var headers = {
            "content-type": 'application/json'
        };

        body = JSON.stringify(body);
        //console.log(body);

        this.post(url, body, headers, parse);
    }

}

exports.job = new nodeio.Job({


    input:function(start, num, callback) {


        var vineyard = Mixin.vineyard;
        vineyard.call(this, 'GET', '/queue', {site:this.options.site},
            function(body) {


                if (body && body.url) {

                    // can't emit an object, so strinify it, the extended
                    // jobs will need to parse
                    body =
                    {
                        id:body._id,
                        url:body.url,
                        loc:body.loc,
                        industry:body.industry
                    }


                    callback([body]);
                } else {
                    callback(false);// finished
                }
            });


    },


    run:function(job) {

        _mixin.call(this);

        // since node.io only copies the core functions when
        // forking an job instance we must mixin the methods

        this._run(job);

    }
});
function _mixin() {
    if (!this.mixin) {
        this.options.spoof = true;
        nodeio.utils.put(this, this.options.methods);
        this.mixin = true;
    }
}

//console.log(Job.prototype);

