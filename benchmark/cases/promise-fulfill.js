var Benchmark = require('../benchmark');
var vendors = require('../vendors');

var benchmark = Benchmark('defer-fulfill');

Object.keys(vendors).forEach(function (name) {
    benchmark.add(name, executeWithThen(vendors[name]));
});

benchmark.run(10000);

function executeWithThen(vendor) {
    var i = 0;
    return function () {
        vendor.fulfilled(i++);
    }
}