var Benit = require('benit');

function genFns(dest) {
    for (var i = 0; i < 10; i++) {
        dest['fn' + i] = genFn(i);
    }

    return dest;

    function genFn(i) {
        return function () {
            return i;
        }
    }
}

var proto = genFns({});

var f = function () {};

Benit('proto-vs-copy')
    .add('proto', function () {
        var p = function () {};
        p.__proto__ = proto;
    })
    .add('copy', function () {
        var p = new f;
        genFns(p);
    })
    .on('start', function () {
        console.log(this.title());
    })
    .on('test', function (test) {
        console.log(test.toString());
    })
    .run(10000, 20);

