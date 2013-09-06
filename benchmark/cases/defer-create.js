var Benchmark = require('../benchmark');
var vendors = require('../vendors');

var benchmark = Benchmark('defer-create');

Object.keys(vendors).forEach(function (name) {
    benchmark.add(name, execute(vendors[name]));
});

benchmark.run(10000, 20);

function execute(vendor) {
    return function () {
        vendor.defer();
    }
}