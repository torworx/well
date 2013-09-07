//
// This tests a library-provided promise-aware reduce()
// function, if available.
//
// Note that in my environment, using node v0.10.17, deferred.reduce
// causes a stack overflow for an array length >= 594.
//

var Benchmark = require('../benchmark');
var vendors = require('../vendors');

var i, array, iterations;

// Causes stack overflow in deferred.reduce
// iterations = 595;
iterations = 594;
var benchmark = Benchmark('reduce-small x ' + iterations);

array = [];
for (i = 1; i < iterations; i++) {
    array.push(i);
}

// 'NOTE: in node v0.10.17, deferred.reduce causes a\nstack overflow for an array length >= 595'
Object.keys(vendors).forEach(function (name) {
    if (!vendors[name].reduce) return;
    benchmark.add(name, execute(vendors[name]));
});

benchmark.run(1);

function execute(vendor) {
    return function (count, done) {
        return vendor.reduce(array, function (current, next) {
            return vendor.fulfilled(current + next);
        }, vendor.fulfilled(0)).then(done, console.error);
    }
}
