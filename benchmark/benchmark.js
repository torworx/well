"use strict";

var Benit = require('benit');
var _ = require('lodash');
var helper = require('./helper');
var Ptime = require('profy/time');
var Pmem = require('profy/mem');

var argv = require('optimist').argv;

module.exports = function (name, options) {
    options = options || {};
    var benit = Benit(name);
    benit.use({
        "initialize": initialize(options)
    });
    return benit;
};

function initialize(options) {
    return function (benit) {
        var sizes = [36, 10];
        return benit
            .on('error', function (err) {
                throw err;
            })
            .on('start', function () {
                console.log('==========================================================');
                console.log('=', this.name);
                console.log('==========================================================');
            })
            .on('test start', function (test) {
                console.log('Benchmarking : ' + test.name + ' x ' + test.count);
                test._pmem = new Pmem;
                test._result = [];

                // current cycle
                test.__cycle = 0;
            })
            .on('cycle start', function (test) {
                test.__cycle++;
                test._ptime = new Ptime;
                test._ptime.start();
                test._ptime.log('start');
            })
            .on('cycle', function (test) {
                var finish = test._ptime.log('finish');
                test._ptime.stop();
                if (!test._key_time) {
                    test._key_time = finish;
                }

                // Get result
                var results = test._ptime.result();

                var diff = test._ptime.get(test._key_time).diff / 1000;
                var total = results.stats.total;

                test._result.push({
                    diff: diff,
                    total: total
                });
                if (!argv.s) console.log(test.__cycle + ' - elapse: ' + diff + 'ms, total: ' + total + 'ms');
            })
            .on('test', function () {
                if (!argv.s) console.log('----------------------------------------------------------');
            })
            .on('complete', function () {
                var results;
                // calculate
                this.tests.forEach(function (test) {
                    test._mean = mean(test._result, 'diff', test.cycle);
                    test._total = mean(test._result, 'total', test.cycle);
                });


                // Report for mean time
                results = _.sortBy(this.tests, function (test) { return test._mean; });

                console.log('==========================================================');
                console.log(this.name, ' -- Mean time:');
                console.log('----------------------------------------------------------');
                console.log(helper.columns([
                    'Name',
                    'Time ms',
                    'Diff %'
                ], sizes));
                results.forEach(function (test, index) {
                    var diff = helper.difference(results[0]._mean, test._mean);
                    console.log(helper.columns([
                        index + 1 + ':' + test.name,
                        helper.formatNumber(test._mean, 0),
                        helper.formatNumber(diff, 2)
                    ], sizes));
                });

                console.log('');

                if (options.total) {
                    // Report for mean time
                    results = _.sortBy(this.tests, function (test) { return test._total; });

                    console.log('==========================================================');
                    console.log(this.name, ' -- Total time:');
                    console.log('----------------------------------------------------------');
                    console.log(helper.columns([
                        'Name',
                        'Time ms',
                        'Diff %'
                    ], sizes));
                    results.forEach(function (test, index) {
                        var diff = helper.difference(results[0]._total, test._total);
                        console.log(helper.columns([
                            index + 1 + ':' + test.name,
                            helper.formatNumber(test._total, 0),
                            helper.formatNumber(diff, 2)
                        ], sizes));
                    });
                    console.log('');
                }
                process.exit(0);
            });
    }
}


function mean(array, prop, count) {
    var sum = 0;
    array.forEach(function (item) {
        sum += item[prop];
    });
    var avg = sum / count;
    return Math.round(avg * 100) / 100;
}