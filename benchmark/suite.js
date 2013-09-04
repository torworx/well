var Benchmark = require('./benchmark');
var _ = require('lodash');
var helper = require('./helper');

module.exports = function (name) {
    var suite = Benchmark(name);
    return initialize(suite);
};

function initialize(suite) {
    var sizes = [36, 10];
    var header = helper.columns([
        'Name',
        'Time ms',
        'Diff %'
    ], sizes);
    return suite
        .on('start', function () {
            console.log('==========================================================');
            console.log(this.name, 'x 10000 :');
            console.log('----------------------------------------------------------');

        })
        .on('cycle', function (event) {
            process.stdout.write('.');
        })
        .on('complete', function () {
            process.stdout.write('\n');
            console.log(header);

            var results = _.sortBy(this.tests, function (test) { return test.time; });

            results.forEach(function (test, index) {
                var diff = helper.difference(results[0].time, test.time);
                console.log(helper.columns([
                    index + 1 + ':' + test.name,
                    helper.formatNumber(test.time, 0),
                    helper.formatNumber(diff, 2)
                ], sizes));
            });

            process.exit(0);
        });
}
