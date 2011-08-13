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
    callback.call(scope);

    /*var Comment = this._db.model("Comment");
     this.debug("fetchLashHash.start");
     var self = this;

     var regex = new Regexp(["^[0-9]+",this.locationId(),this.site(true)].join("-"));
     Comment.findOne({"_id":regex}, {"_id":1}, function(err, c) {
     // TODO error checking
     c = c || {uuid:""};

     self.debug("LastHash for [" + self._site + "] =" + c.uuid);

     callback.call(scope, c.uuid);

     });*/
}
/**
 *
 * @param {Comment} comment
 * @param level
 */
Mixin.density = function(comment, level) {
    /* var hash = this._density(comment.contet, level);

     for (word in hash) {
     comment.keywords.push({word:word,count:hash[word]});
     }*/

}
Mixin._density = function(content, level) {
    // return density.getDensity(content, level || 2);
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
        _id:null, // hash from site.host|comment.date|comment.commiter - indexed
        score:null,
        identity:null,
        metrics:[],
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
Mixin._get = function(page, callback, scope) {
    var self = this;
    var process = function(err, data) {
        this._currentPage = parseInt(page);

        if (err) {
            throw er;
            console.log(err);
            return;
        }

        var finish = function() {
            if (callback != null)
                callback.apply(scope)
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
        this._rating = this._parseRating($, data);

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


    var i = 0;
    var len = this._comments.length;
    var self = this;

    this.Config.vineyard("POST", "/reviews",
        {
            loc:this.locationId(),
            site:this.site(),
            industry:this._industry,
            rating:this._rating,
            comments:this._comments
        }, function(err, response, body) {
            self._comments = [];
            self._rating = null;
            self.emit("finished :" + self._currentURL);
        })


}
/**
 * Comutes an hash for the object
 * @param obj
 */


Mixin.debug = function() {
    if (this.options.debug) {
        console.log(Array.prototype.slice.call(arguments));
        // this.logger.debug.apply(this.logger, Array.prototype.slice.call(arguments));
    }
}
Mixin.transform = function(str) {
    return str.toLowerCase().replace(/[^a-z]+/g, "_");
}
Mixin.check = function(obj) {
    obj._id = this.Config.hash(obj);
    if (obj._id != this._lastHash) {
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

Mixin.more = function() {
    return this._more;
}
Mixin._run = function(url) {

    var self = this;
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

Mixin.init = function(industry, env) {
    var Config = require(__dirname + '/../config/config').Config;
    this.Config = new Config(industry, env);
}
exports.methods = function() {
    return nodeio.utils.put({}, Mixin);
}

exports.job = new nodeio.Job({


    input:function(start, num, callback) {
        _mixin.call(this);
        var self = this;
        this.Config.vineyard("GET", "/queue", {site:this.options.site},
            function(err, response, body) {
                if (body && body.hasOwnProperty("url")) {
                    self.locationId(body.loc);
                    self._industry = body.industry;

                    callback(body.url);
                }
            });

    },


    run:function(url) {

        _mixin.call(this);

        // since node.io only copies the core functions when
        // forking an job instance we must mixin the methods

        this._run(url);

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

