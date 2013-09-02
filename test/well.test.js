
var well = require('../');
var t = require('chai').assert;
require('chai').Assertion.includeStack = true;

var fakePromise, sentinel, other;
function identity(val) { return val; }
function constant(val) { return function() { return val; }; }

sentinel = {};
other = {};

fakePromise = new FakePromise();

// Untrusted, non-Promises/A-compliant promise
function FakePromise(val) {
    this.then = function (cb) {
        if (cb) {
            cb(val);
        }
        return this;
    };
}

describe('well', function () {

    it('should return a promise for a value', function () {
        var result = well(1);
        t.isFunction(result.then);
    });


    it('should return a promise for a promise', function() {
        var result = well(fakePromise);
        t.isFunction(result.then);
    });

    it('should not return the input promise', function() {
        var result = well(fakePromise, identity);
        t.isFunction(result.then);
        t.notStrictEqual(result, fakePromise);
    });

    it('should return a promise that forwards for a value', function() {
        var result = well(1, constant(2));

        t.isFunction(result.then);

        return result.then(
            function(val) {
                t.equal(val, 2);
            },
            t.fail
        );
    });

    it('should invoke fulfilled handler asynchronously for value', function() {
        var val = other;

        try {
            return well({}, function() {
                t.strictEqual(val, sentinel);
            });
        } finally {
            val = sentinel;
        }
    });

    it('should invoke fulfilled handler asynchronously for fake promise', function() {
        var val = other;

        try {
            return well(fakePromise, function() {
                t.strictEqual(val, sentinel);
            });
        } finally {
            val = sentinel;
        }
    });

    it('should invoke fulfilled handler asynchronously for resolved promise', function() {
        var val = other;

        try {
            return well(well.resolve(), function() {
                t.strictEqual(val, sentinel);
            });
        } finally {
            val = sentinel;
        }
    });

    it('should invoke rejected handler asynchronously for rejected promise', function() {
        var val = other;

        try {
            well(well.reject(),
                t.fail, function() { t.strictEqual(val, sentinel); }
            );
        } finally {
            val = sentinel;
        }
    });

    it('should support deep nesting in promise chains', function() {
        var d, result;

        d = well.defer();
        d.resolve(false);

        result = well(well(d.promise.then(function(val) {
            var d = well.defer();
            d.resolve(val);
            return well(d.promise.then(identity), identity).then(
                function(val) {
                    return !val;
                }
            );
        })));

        result.done(
            function(val) {
                t.ok(val);
            },
            t.fail
        );
    });


});