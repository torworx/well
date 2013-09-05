var Benchmark = require('../benchmark');
var vendors = require('../vendors');

var benchmark = Benchmark('defer-reject');

Object.keys(vendors).forEach(function (name) {
    benchmark.add(name, executeWithThen(vendors[name]));
    // Deferred reject a uncaught error will throw
//    if (vendors[name].defer().promise.done) {
//        benchmark.add(name + ' done()', executeWithDone(vendors[name]));
//    }
});

benchmark.run(10000);

var err = new Error();
function executeWithThen(vendor) {
    return function () {
        var d = vendor.defer();
        d.promise.then(addOne);
        d.reject(err);
    }
}

function executeWithDone(vendor) {
    return function () {
        var d = vendor.defer();
        d.promise.done(addOne);
        d.reject(err);
    }
}

function addOne(x) {
    return x + 1;
}
