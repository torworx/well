var Benchmark = require('../benchmark');
var vendors = require('../vendors');

var i, array, iterations = 10000;
var benchmark = Benchmark('defer-sequence x ' + iterations);

array = [];
for (i = 1; i < iterations; i++) {
    array.push(i);
}

Object.keys(vendors).forEach(function (name) {
    benchmark.add(name, execute(name, vendors[name]));
});

benchmark.run(1, 20);

function execute(name, vendor) {

    return function (count, done) {
        var d = vendor.defer();
        d.fulfill(0);
        // Use reduce to chain <iteration> number of promises back
        // to back.  The final result will only be computed after
        // all promises have resolved
        return array.reduce(function (promise, nextVal) {
            return promise.then(function (currentVal) {
                // Uncomment if you want progress indication:
//                if (nextVal % 1000 === 0) console.log(name, nextVal);
                var d = vendor.defer();
                d.fulfill(currentVal + nextVal);
                return d.promise;
            });
        }, d.promise).then(done);
    }
}
