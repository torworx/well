require('./init');
var well = require('../');
var t = require('chai').assert;

var isFrozen, sentinel, other, slice, undef;

sentinel = {};
other = {};

slice = Array.prototype.slice;

// In case of testing in an environment without Object.isFrozen
isFrozen = Object.isFrozen || function() { return true; };

function f() {}

function assertPending(s) {
    t.equal(s.state, 'pending');
}

function assertFulfilled(s, value) {
    t.equal(s.state, 'fulfilled');
    t.strictEqual(s.value, value);
}

function assertRejected(s, reason) {
    t.equal(s.state, 'rejected');
    t.strictEqual(s.reason, reason);
}

describe('well/promise-test', function () {

    var defer;

    defer = well.defer;

    // TODO: Reinstate when v8 Object.freeze() performance is sane
    //	it('should be frozen', function() {
    //		t.ok(isFrozen(defer().promise));
    //	};

    describe('then', function () {

        it('should return a promise', function() {
            t.isFunction(defer().promise.then().then);
        });

        it('should allow a single callback function', function() {
            t.isFunction(defer().promise.then(f).then);
        });

        it('should allow a callback and errback function', function() {
            t.isFunction(defer().promise.then(f, f).then);
        });

        it('should allow a callback, errback, and progback function', function() {
            t.isFunction(defer().promise.then(f, f, f).then);
        });

        it('should allow null and undefined', function() {
            t.isFunction(defer().promise.then().then);

            t.isFunction(defer().promise.then(null).then);
            t.isFunction(defer().promise.then(null, null).then);
            t.isFunction(defer().promise.then(null, null, null).then);

            t.isFunction(defer().promise.then(undef).then);
            t.isFunction(defer().promise.then(undef, undef).then);
            t.isFunction(defer().promise.then(undef, undef, undef).then);
        });

        it('should allow functions and null or undefined to be mixed', function() {
            t.isFunction(defer().promise.then(f, null).then);
            t.isFunction(defer().promise.then(f, null, null).then);
            t.isFunction(defer().promise.then(null, f).then);
            t.isFunction(defer().promise.then(null, f, null).then);
            t.isFunction(defer().promise.then(null, null, f).then);
        });


        describe('should ignore non-functions', function () {
            describe('when fulfillment handler', function() {
                it('is empty string', function(done) {
                    well.resolve(true).then('').then(t.ok, t.fail).ensure(done);
                });
                it('is false', function(done) {
                    well.resolve(true).then(false).then(t.ok, t.fail).ensure(done);
                });
                it('is true', function(done) {
                    well.resolve(true).then(true).then(t.ok, t.fail).ensure(done);
                });
                it('is object', function(done) {
                    well.resolve(true).then({}).then(t.ok, t.fail).ensure(done);
                });
                it('is falsey', function(done) {
                    well.resolve(true).then(0).then(t.ok, t.fail).ensure(done);
                });
                it('is truthy', function(done) {
                    well.resolve(true).then(1).then(t.ok, t.fail).ensure(done);
                });
            });

            describe('when rejection handler', function () {
                it('is empty string', function(done) {
                    well.reject(true).then(null, '').then(t.fail, t.ok).ensure(done);
                });
                it('is false', function(done) {
                    well.reject(true).then(null, false).then(t.fail, t.ok).ensure(done);
                });
                it('is true', function(done) {
                    well.reject(true).then(null, true).then(t.fail, t.ok).ensure(done);
                });
                it('is object', function(done) {
                    well.reject(true).then(null, {}).then(t.fail, t.ok).ensure(done);
                });
                it('is falsey', function(done) {
                    well.reject(true).then(null, 0).then(t.fail, t.ok).ensure(done);
                });
                it('is truthy', function(done) {
                    well.reject(true).then(null, 1).then(t.fail, t.ok).ensure(done);
                });
            });

            describe('when progress handler', function () {
                it('is empty string', function(done) {
                    var d = well.defer();
                    d.promise.then(null, null, '').then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
                it('is false', function(done) {
                    var d = well.defer();
                    d.promise.then(null, null, false).then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
                it('is true', function(done) {
                    var d = well.defer();
                    d.promise.then(null, null, true).then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
                it('is object', function(done) {
                    var d = well.defer();
                    d.promise.then(null, null, {}).then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
                it('is falsey', function(done) {
                    var d = well.defer();
                    d.promise.then(null, null, 0).then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
                it('is truthy', function(done) {
                    var d = well.defer();
                    d.promise.then(null, null, 1).then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
            });
        });
    });

    describe('cb', function () {

        it('should call callback when resolve', function (done) {
            var d = well.defer();
            d.promise.cb(function (err, value) {
                t.notOk(err);
                t.equal(value, sentinel);
                done();
            });
            d.resolve(sentinel);
        });

        it('should call callback when reject', function (done) {
            var d = well.defer();
            d.promise.cb(function (err, value) {
                t.equal(err, sentinel);
                t.notOk(value);
                done();
            });
            d.reject(sentinel);
        });

    });

});
