var Suite = require('../suite');
var vendors = require('../vendors');

var suite = Suite('defer-fulfill');

Object.keys(vendors).forEach(function (name) {
    suite.add(name, executeWithThen(vendors[name]));
});

suite.run(10000);

function executeWithThen(vendor) {
    var i = 0;
    return function () {
        vendor.fulfilled(i++);
    }
}