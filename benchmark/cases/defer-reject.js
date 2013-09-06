var Benchmark = require('../benchmark');
var vendors = require('../vendors');

var benchmark = Benchmark('defer-reject');

Object.keys(vendors).forEach(function (name) {
    benchmark.add(name, execute(vendors[name]));
});

benchmark.run(10000);

function execute(vendor) {
    return function () {
        var d = vendor.defer();
        d.promise.then(addOne);
        d.reject();
    }
}

function addOne(x) {
    return x + 1;
}
