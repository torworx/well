var Benchmark = require('../benchmark');
var vendors = require('../vendors');

var benchmark = Benchmark('defer-fulfill');

Object.keys(vendors).forEach(function (name) {
    benchmark.add(name, execute(vendors[name]));
    if (vendors[name].defer().promise.done) {
        benchmark.add(name + ' done()', executeWithDone(vendors[name]));
    }
});

benchmark.run(10000);

function execute(vendor) {
    return function () {
        var d = vendor.defer();
        d.promise.then(addOne);
        d.fulfill(1);
    }
}

function executeWithDone(vendor) {
    return function () {
        var d = vendor.defer();
        d.promise.done(addOne);
        d.fulfill(1);
    }
}

function addOne(x) {
    return x + 1;
}
