var Suite = require('../suite');
var vendors = require('../vendors');

var suite = Suite('defer-fulfill');

Object.keys(vendors).forEach(function (name) {
    suite.add(name, executeWithThen(vendors[name]));
    if (vendors[name].defer().promise.done) {
        suite.add(name + ' done()', executeWithDone(vendors[name]));
    }
});

suite.run(10000);

function executeWithThen(vendor) {
    return function () {
        var d = vendor.defer();
        d.promise.then(addOne);
        d.fulfill(1);
    }
}

function executeWithDone(vendor) {
    return function () {
        var d = vendor.defer();
        d.promise.done(addOne);
        d.fulfill(1);
    }
}

function addOne(x) {
    return x + 1;
}
