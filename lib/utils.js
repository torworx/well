'use strict';

var indexOf = String.prototype.indexOf;

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};
exports.object_create = object_create;

exports.contains = contains;
function contains(searchString/*, position*/) {
    return indexOf.call(this, searchString, arguments[1]) > -1;
}

exports.d = d;
function d(dscr, value) {
    var c, e, w;
    if (arguments.length < 2) {
        value = dscr;
        dscr = null;
    }
    if (dscr == null) {
        c = w = true;
        e = false;
    } else {
        c = contains.call(dscr, 'c');
        e = contains.call(dscr, 'e');
        w = contains.call(dscr, 'w');
    }

    return { value: value, configurable: c, enumerable: e, writable: w };
}