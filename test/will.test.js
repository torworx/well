
var will = require('../');
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

describe('will', function () {

    it('should return a promise for a value', function () {
        var result = will(1);
        t.isFunction(result.then);
    });


    it('should return a promise for a promise', function() {
        var result = will(fakePromise);
        t.isFunction(result.then);
    });

    it('should not return the input promise', function() {
        var result = will(fakePromise, identity);
        t.isFunction(result.then);
        t.notStrictEqual(result, fakePromise);
    });

    it('should return a promise that forwards for a value', function() {
        var result = will(1, constant(2));

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
            return will({}, function() {
                t.strictEqual(val, sentinel);
            });
        } finally {
            val = sentinel;
        }
    });

    it('should invoke fulfilled handler asynchronously for fake promise', function() {
        var val = other;

        try {
            return will(fakePromise, function() {
                t.strictEqual(val, sentinel);
            });
        } finally {
            val = sentinel;
        }
    });

    it('should invoke fulfilled handler asynchronously for resolved promise', function() {
        var val = other;

        try {
            return will(will.resolve(), function() {
                t.strictEqual(val, sentinel);
            });
        } finally {
            val = sentinel;
        }
    });

    it('should invoke rejected handler asynchronously for rejected promise', function() {
        var val = other;

        try {
            will(will.reject(),
                t.fail, function() { t.strictEqual(val, sentinel); }
            );
        } finally {
            val = sentinel;
        }
    });

    it('should support deep nesting in promise chains', function() {
        var d, result;

        d = will.defer();
        d.resolve(false);

        result = will(will(d.promise.then(function(val) {
            var d = will.defer();
            d.resolve(val);
            return will(d.promise.then(identity), identity).then(
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