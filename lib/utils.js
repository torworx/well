var utils = module.exports = {};

var indexOf = String.prototype.indexOf
    , forEach = Array.prototype.forEach
    , slice = Array.prototype.slice
    , keys = Object.keys;

function objectToString(o) {
    return Object.prototype.toString.call(o);
}

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

utils.isError = function (e) {
    return typeof e === 'object' && objectToString(e) === '[object Error]';
};

function _merge (src) {
    keys(Object(src)).forEach(function (key) {
        this[key] = src[key];
    }, this);
}

utils.merge = function (dest/*, …src*/) {
    slice.call(arguments, 1).forEach(_merge, dest);
    return dest;
};
