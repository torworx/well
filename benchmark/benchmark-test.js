var Benchmark = require('./benchmark');

var bench = Benchmark('Benchmark Test');

// add tests
bench
    .add('RegExp#test', function () {
        /o/.test('Hello World!');
    })
    .add('String#indexOf', function () {
        'Hello World!'.indexOf('o') > -1;
    })
    .add('String#match', function () {
        !!'Hello World!'.match(/o/);
    })
    .on('start', function () {
        console.log('start');
    })
    .on('cycle', function (test) {
        console.log(test.toString());
    })
    .on('complete', function () {
//        console.log('Fastest is ' + this.filter('fastest').pluck('name'));
        console.log('complete');
    })
// run async
    .run(100000);