var utils = module.exports = {};

var indexOf = String.prototype.indexOf;
utils.contains = function (searchString/*, position*/) {
    return indexOf.call(this, searchString, arguments[1]) > -1;
};

utils.d = function (dscr, value) {
    var c, e, w;
    if (arguments.length < 2) {
        value = dscr;
        dscr = null;
    }
    if (dscr == null) {
        c = w = true;
        e = false;
    } else {
        c = utils.contains.call(dscr, 'c');
        e = utils.contains.call(dscr, 'e');
        w = utils.contains.call(dscr, 'w');
    }

    return { value: value, configurable: c, enumerable: e, writable: w };
};