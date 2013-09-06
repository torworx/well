var Benchmark = require('../benchmark');
var vendors = require('../vendors');

var benchmark = Benchmark('promise-sequence');

var i, array, iterations;
iterations = 100000;

array = [];
for (i = 1; i < iterations; i++) {
    array.push(i);
}

Object.keys(vendors).forEach(function (name) {
    benchmark.add(name, executeWithThen(name, vendors[name]));
});

benchmark.run(1);

function executeWithThen(name, vendor) {
    return function (count, done) {
        // Use reduce to chain <iteration> number of promises back
        // to back.  The final result will only be computed after
        // all promises have resolved
        return array.reduce(function (promise, nextVal) {
            return promise.then(function (currentVal) {
                // Uncomment if you want progress indication:
//                if (nextVal % 1000 === 0) console.log(name, nextVal);
                return vendor.fulfilled(currentVal + nextVal);
            });
        }, vendor.fulfilled(0))
            .then(function () {
                done();
            });
    }
}
