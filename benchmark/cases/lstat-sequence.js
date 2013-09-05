var Benchmark = require('../benchmark');
var vendors = require('../vendors');
var lstat = require('fs').lstat;

var benchmark = Benchmark('lstat-sequence');

benchmark.add('Base (plain Node.js lstat call)', function (count, complete) {
    execute();
    function execute() {
        lstat(__filename, function (err, stats) {
            if (err) {
                throw err;
            }
            if (count--) execute();
            else complete();
        });
    }
});

Object.keys(vendors).forEach(function (name) {
    benchmark.add(name, executeWithThen(vendors[name]));
    if (vendors[name].defer().promise.done) {
        benchmark.add(name + ' done()', executeWithDone(vendors[name]));
    }
});

benchmark.run(10000);

function vendor_dlstat(vendor) {
    return function (path) {
        var def = vendor.defer();
        lstat(path, function (err, stats) {
            if (err) {
                def.reject(err);
            } else {
                def.fulfill(stats);
            }
        });
        return def.promise;
    };
}

function executeWithThen(vendor) {
    var dlstat = vendor_dlstat(vendor);
    return function (count, complete) {
        execute();
        function execute() {
            dlstat(__filename).then(function (stats) {
                if (count--) execute();
                else complete();
            });
        }
    }
}

function executeWithDone(vendor) {
    var dlstat = vendor_dlstat(vendor);
    return function (count, complete) {
        execute();
        function execute() {
            dlstat(__filename).done(function (stats) {
                if (count--) execute();
                else complete();
            });
        }
    }
}