/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/11/11
 * Time: 12:06 AM
 * To change this template use File | Settings | File Templates.
 */

var _ = require(__dirname + '/merger');
var Aggregates = require(__dirname + '/../config/aggregates');

function formatDate(date) {

    var month = date.getMonth() + 1;
    if (month < 10)
        month = "0" + month;
    var day = date.getDate();
    if (day < 10) {
        day = "0" + day;
    }
    var year = date.getFullYear();
    return [month,day,year].join("-");
}
exports.Aggregator = Aggregator = function(db, type, config) {

    this._db = db;
    this._config = config;
    var MetricsClass = this._db.model("Metrics");
    this._metrics = new MetricsClass();
    this._type = type;
    this._aggregators = Aggregates[this._type];
    this._updates = {};
}

Aggregator.prototype.reset = function() {
    this._updates = {};
}
Aggregator.prototype.process = function(key, object) {


    var date,
        path = "aggregates." + key;
    for (var name in this._aggregators) {
        date = formatDate(object.date);

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
                date:formatDate(new Date(0)),
                period:"overall"
            });// epoch
        }

        for (var i in dates) {

            //by aggregate path

            var date_info = dates[i];
            var date = date_info.date;
            var period = data_info.period;
            if (!this._updates[name][date]) {
                this._updates[name][date] = {
                    period:period,
                    data:{}
                }
            }
            //   if (!this._updates[name][date].data[path]) {
            var update;
            // if we need to hash by a key value rather then setting
            // the values to the top level
            if (rules.by) {
                if (!this._updates[name][date].data[path]) {
                    this._updates[name][date].data[path] = {};
                }
                // for hash like revies which are hashed as
                //aggregates.{key}.{site}=defults
                if (!this._updates[name][date].data[path][object[rules.by]]) {
                    update = _.clone(rules.defaults);
                    this._updates[name][date].data[path][object[rules.by]] = update;
                } else {
                    update = this._updates[name][date].data[path][object[rules.by]];
                }

            } else {
                if (!this._updates[name][date].data[path]) {
                    update = _.clone(rules.defaults);
                    this._updates[name][date].data[path] = update;
                } else {
                    update = this._updates[name][date].data[path];
                }
            }

            // }
            //= this._updates[date][path];

            this._add(rules.counters, update, object);
        }

        if (typeof rules.finalize == "function") {
            rules.finalize(this._db, object, this._config);
        }
    }
}
Aggregator.prototype._add = function(counters, update, object) {
    for (var counter in counters) {
        if (typeof counters[counter] == "object") {
            this._add(counters[counter], update[counter], object);
        } else if (typeof counters[counter] == "function") {
            update[counter] += counters[counter](object);
        } else if (typeof counters[counter] == 'number') {
            update[counter] += counters[counter];
        } else if (typeof counters[counter] == 'string') {
            update[counter] += object[counters[counter]];
        }
    }
}

Aggregator.prototype.set = function() {


    this._update('$set');


}
Aggregator.prototype._update = function(fastmod) {
    var options = {upsert:true},doc,selector;


    for (var date in this._updates[name]) {
        var date_info = this._updates[name][date];
        var period = date_info.period;
        var data = date_info.data;
        var doc = {};
        doc[fastmod] = data;
        selector = {
            name:name,
            period:period,
            date:new Date(date)
        };


    }
//TODO add error checking on updates
    this._metrics.collection.update(selector, doc, options);
    this.reset();
}

Aggregator.prototype.inc = function(collection) {

    this._update("$inc");


}
exports = Aggregator;