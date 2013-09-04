var Benchmark = require('benchmark');
var well = require('../');
var suite = new Benchmark.Suite;

function addOne(x) {
    return x + 1;
}

// add tests
suite
    .add('direct', function () {
        addOne(1);
    })
    .add('resolve', function () {
        var d = well.defer();
        d.promise.then(addOne);
        d.resolve(1);
    })
    .add('reject', function () {
        var d = well.defer();
        d.promise.then(addOne);
        d.reject(1);
    })
// add listeners
    .on('cycle', function (event) {
        console.log(String(event.target));
    })
    .on('complete', function () {
        console.log('Fastest is ' + this.filter('fastest').pluck('name'));
    })
// run async
    .run({ 'async': true });