require('./init');
var well = require('../');
var t = require('chai').assert;

var sentinel = {};
var other = {};

describe('well/cancelable-test', function () {

    it('should decorate deferred with a cancel() method', function () {
        var c = well.defer(function () {
        });
        t.isFunction(c.cancel);
        t.isFunction(c.promise.cancel);
    });

    it('should propagate a rejection when a cancelable deferred is canceled', function (done) {
        var c = well.defer(function () {
            return sentinel;
        });
        c.cancel();

        c.promise.then(
            t.fail,
            function (v) {
                t.equal(v, sentinel);
                done();
            }
        );
    });

    it('should return a promise for canceled value when canceled', function (done) {
        var c, promise;

        c = well.defer(function () {
            return sentinel;
        });
        promise = c.cancel();

        promise.then(
            t.fail,
            function (v) {
                t.equal(v, sentinel);
                done();
            }
        );
    });

    it('should not invoke canceler when rejected normally', function (done) {
        var c = well.defer(function () {
            return other;
        });
        c.reject(sentinel);
        c.cancel();

        c.promise.then(
            t.fail,
            function (v) {
                t.equal(v, sentinel);
                done();
            }
        );
    });

    it('should propagate the unaltered resolution value', function (done) {
        var c = well.defer(function () {
            return other;
        });
        c.resolve(sentinel);
        c.cancel();

        c.promise.then(
            function (val) {
                t.strictEqual(val, sentinel);
                done();
            },
            function (e) {
                console.error(e);
                t.fail(e);
            }
        );
    });

    it('should call progback for cancelable deferred', function (done) {
        var c = well.defer();

        c.promise.then(null, null, function (status) {
            t.strictEqual(status, sentinel);
            done();
        });

        c.notify(sentinel);
    });

});
