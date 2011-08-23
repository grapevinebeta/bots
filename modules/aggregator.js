/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/11/11
 * Time: 12:06 AM
 * To change this template use File | Settings | File Templates.
 */

var _ = require(__dirname + '/merger');
var Aggregates = require(__dirname + '/../config/aggregates').config;


exports.Aggregator = Aggregator = function(db, type, config) {

    this._db = db;
    this._config = config;
    //var MetricsClass =
    this.Metrics = this._db.model("Metrics");
    this._type = type;
    this._aggregators = Aggregates[this._type];
    this._objects = [];
    this._updates = {};
}
function log() {
    console.log.call(null, arguments);
}
Aggregator.prototype.formatDate = function(date) {
    return this._config.formatDate(date);
}
Aggregator.prototype.reset = function() {
    this._updates = {};
    this._objects = [];
}
Aggregator.prototype.process = function(key, object) {


    var date,
        path = key + "";


    for (var name in  this._aggregators) {


        date = this.formatDate(object.date);
        object.date = new Date(date);

        var rules = this._aggregators[name];


        /**
         * name{
         *  date:{
         *      path:info
         *      path:info
         *     }
         *  }
         *
         */
        if (!this._updates[name])
            this._updates[name] = {};
        // create hash by date if not found

        var dates = [
            {
                date:date,
                period:"day"
            }
        ];
        if (rules.overrall) {
            dates.push({
                date:this.formatDate(this._config.epoch()),
                period:"overall"
            });// epoch
        }

        for (var i in dates) {

            //by aggregate path

            var info = dates[i];
            var date = info.date;
            var period = info.period;

            if (!this._updates[name][date]) {
                this._updates[name][date] = {
                    period:period,
                    data:{}
                }
            }

            var update;
            var data = this._updates[name][date].data;
            // if we need to hash by a key value rather then setting
            // the values to the top level
            if (typeof rules.by != "undefined") {
                if (!data[path]) {
                    data[path] = {};
                }
                var by = typeof rules.by == "function" ? rules.by(object) : object[rules.by];
                // for hash like revies which are hashed as
                //aggregates.{key}.{site}=defults

                if (!data[path][by]) {
                    update = _.clone(rules.defaults);
                    data[path][by] = update;
                } else {
                    update = data[path][by];
                }

            } else {
                if (!data[path]) {
                    update = _.clone(rules.defaults);
                    data[path] = update;
                } else {
                    update = data[path];
                }
            }


            this._add(rules.counters, update, object);
        }


    }
    this._objects.push(object);


}
Aggregator.prototype.flush = function(inc) {

    var self = this;
    var fastmod = inc ? "$inc" : "$set";
    process.nextTick(function() {
        log("flushing...");
        self._flush(fastmod);
    });


}
Aggregator.prototype._flush = function(fastmod) {

    var rules;
    var objects = this._objects;
    var db = this._db;
    var config = this._config;
    for (var name in  this._aggregators) {
        rules = this._aggregators[name];
        if (typeof rules.finalize == "function") {
            rules.finalize(db, objects, config);
        }
    }

    this._update(fastmod);

}
Aggregator.prototype._add = function(counters, update, object) {
    var value;
    for (var counter in counters) {
        var applier = counters[counter];
        if (typeof applier == "object") {
            this._add(applier, update[counter], object);
        } else if (typeof applier == "function") {
            value = applier(object);
        } else if (typeof applier == 'number') {
            value = applier;
        } else if (typeof applier == 'string') {
            value = object[applier];
        }
        if (typeof value == "undefined") continue;
        if (typeof value == "string") {
            update[counter] = value;
        } else {
            update[counter] += value;
        }

    }
}

Aggregator.prototype._update = function(fastmod) {
    var options = {upsert:true},doc,selector;

    /* var fs = require("fs");
     var content = JSON.stringify(this._updates);

     fs.writeFileSync('updates.txt', content);
     ;*/
    for (var name in this._updates) {
        var metric = this._updates[name];
        //  fs.writeFileSync('metric-' + name + '.txt', JSON.stringify(metric));
        for (var date in metric) {
            var info = metric[date];
            var period = info.period;
            var data = info.data;
            var doc = {
                $inc:flatten({
                    aggregates:data
                })
            };
            // doc[fastmod] =
            selector = {
                date:new Date(date),
                type:name,
                period:period

            };


            //   console.log(selector);
            //  console.log(doc[fastmod].aggregates);

            this.Metrics.collection.update(selector, doc,
                {safe:true,upsert:true}, function(err) {
                    if (err) console.warn(err.message);
                    else console.log('successfully updated');
                });


        }
    }

    this.reset();

}
function flatten(obj, includePrototype, into, prefix) {
    into = into || {};
    prefix = prefix || "";


    var has_nested;
    var tmp = {};
    var has_temp = false;
    for (var k in obj) {
        if (includePrototype || obj.hasOwnProperty(k)) {
            var prop = obj[k];
            if (prop && typeof prop === "object" &&
                !(prop instanceof Date || prop instanceof RegExp)) {
                has_nested = true;
                flatten(prop, includePrototype, into, prefix + k + ".");
            }
            else {
                has_temp = true;
                into[prefix + k] = prop;

            }
        }
    }
    /*if (!has_nested || has_temp) {
     into[prefix.substr(0, prefix.length - 1)] = tmp;
     }*/


    return into;
}
exports = Aggregator;