/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/11/11
 * Time: 12:06 AM
 * To change this template use File | Settings | File Templates.
 */

var _ = require('./merger');
var Aggregates = require('../config/aggregates');

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
exports.Aggregator = Aggregator = function(type) {

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

        var rules = this._aggreators[name];

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
        if (!this._updates[name][date]) {
            this._updates[name][date] = {};
        }
        //by aggregate path
        if (!this._updates[name][date][path]) {
            this._updates[name][date][path] = _.clone(rules.defaults);
        }
        var update = this._updates[date][path];

        this._add(rules.counters, update);
    }
}
Aggregator.prototype._add = function(counters, update) {
    for (var counter in counters) {
        if (typeof counters[counter] == "object") {
            this._add(counters[counter], update[counter]);
        } else if (typeof counters[counter] == "function") {
            update[counter] += counters[counter](object);
        } else if (typeof counter[counter] == 'number') {
            update[counter] += counter[counter];
        } else if (typeof counter[counter] == 'string') {
            update[counter] += object[counter[counter]];
        }
    }
}
Aggregator.prototype.commitSet = function(collection) {

    for (var name in this._updates) {

        for (var date in this._updates[name]) {
            collection.update({
                        name:name,
                        period:"day",
                        date:date
                    },
                    {"$set":this._updates[name][date]},
                    {upsert:true});
        }
    }

}
Aggregator.prototype.commitInc = function(collection) {

    for (var name in this._updates) {

        for (var date in this._updates[name]) {
            collection.update({
                        name:name,
                        period:"day",
                        date:date

                    }, {"$inc":this._updates[name][date]},
                    {upsert:true});
        }
    }

}
exports = Aggregator;