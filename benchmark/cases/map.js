var Benchmark = require('../benchmark');
var vendors = require('../vendors');

var i, array, iterations = 10000;
var benchmark = Benchmark('map x ' + iterations);

array = [];
for (i = 1; i < iterations; i++) {
    array.push(i);
}

Object.keys(vendors).forEach(function (name) {
    if (!vendors[name].map) return;
    benchmark.add(name, execute(vendors[name]));
});

benchmark.run(1, 20);

function execute(vendor) {
    return function (count, done) {
        return vendor.map(array, function (value) {
            return vendor.fulfilled(value * 2);
        }).then(done);
    }
}
