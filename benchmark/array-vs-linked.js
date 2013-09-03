var Benchmark = require('benchmark');

function handler(arg) {
    return arg;
}

function testArray(n) {
    var queue = [], i;
    for(i = 0; i < n; i++) {
        queue.push(handler)
    }
    for(i = 0; i < n; i++) {
        queue[i](i);
    }
}

function testLinked(n) {
    var queue, curr, i;
    queue = curr = {};
    for(i = 0; i < n; i++) {
        curr.next = {fn: handler};
        curr = curr.next;
    }
    i = 0;
    while (queue.next) {
        queue = queue.next;
        queue.fn(i++);
    }
}


var suite = new Benchmark.Suite;

// add tests
suite
    .add('array', function () {
        testArray(100);
    })
    .add('linked', function () {
        testLinked(100)
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