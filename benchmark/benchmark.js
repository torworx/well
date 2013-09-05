var Benit = require('benit');
var _ = require('lodash');
var helper = require('./helper');

module.exports = function (name) {
    var benit = Benit(name);
    return initialize(benit);
};

function initialize(benit) {
    var sizes = [36, 10];
    var header = helper.columns([
        'Name',
        'Time ms',
        'Diff %'
    ], sizes);
    return benit
        .on('error', function (err) {
            throw err;
        })
        .on('start', function () {
            console.log(this.name);
            console.log('----------------------------------------------------------');

        })
        .on('test', function (test) {
            console.log(test.toString());
        })
        .on('complete', function () {
            console.log('==========================================================');
            console.log(this.name, ':');
            console.log('----------------------------------------------------------');
            console.log(header);

            var results = _.sortBy(this.tests, function (test) { return test.stats.mean; });

            results.forEach(function (test, index) {
                var diff = helper.difference(results[0].stats.mean, test.stats.mean);
                console.log(helper.columns([
                    index + 1 + ':' + test.name,
                    helper.formatNumber(test.stats.mean, 0),
                    helper.formatNumber(diff, 2)
                ], sizes));
            });

            process.exit(0);
        });
}
