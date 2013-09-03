require('./init');
var well = require('../');
var t = require('chai').assert;

var fakePromise, sentinel, other;
function identity(val) {
    return val;
}
function constant(val) {
    return function () {
        return val;
    };
}

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


    it('should return a promise for a promise', function () {
        var result = well(fakePromise);
        t.isFunction(result.then);
    });

    it('should not return the input promise', function () {
        var result = well(fakePromise, identity);
        t.isFunction(result.then);
        t.notStrictEqual(result, fakePromise);
    });

    it('should return a promise that forwards for a value', function () {
        var result = well(1, constant(2));

        t.isFunction(result.then);

        return result.then(
            function (val) {
                t.equal(val, 2);
            },
            t.fail
        );
    });

    describe('fulfilled handler', function () {
        it('should invoke fulfilled handler synchronously for value', function (done) {
            var val = other;

            try {
                return well({}, function () {
                    t.strictEqual(val, other);
                    done();
                });
            } finally {
                val = sentinel;
            }
        });

        it('should invoke fulfilled handler synchronously for fake promise', function (done) {
            var val = other;

            try {
                return well(fakePromise, function () {
                    t.strictEqual(val, other);
                    done();
                });
            } finally {
                val = sentinel;
            }
        });

        it('should invoke fulfilled handler synchronously for resolved promise', function (done) {
            var val = other;

            try {
                return well(well.resolve(), function () {
                    t.strictEqual(val, other);
                    done();
                }, t.fail);
            } finally {
                val = sentinel;
            }
        });

        it('should invoke rejected handler synchronously for rejected promise', function (done) {
            var val = other;

            try {
                well(well.reject(),
                    t.fail, function () {
                        t.strictEqual(val, other);
                        done();
                    }
                );
            } finally {
                val = sentinel;
            }
        });
    });

    it('should support deep nesting in promise chains', function (done) {
        var d, result;

        d = well.defer();
        d.resolve(false);

        result = well(well(d.promise.then(function (val) {
            var d = well.defer();
            d.resolve(val);
            return well(d.promise.then(identity), identity).then(
                function (val) {
                    return !val;
                }
            );
        })));

        result.then(
            function (val) {
                t.ok(val);
                done();
            },
            t.fail
        );
    });


    it('should return a resolved promise for a resolved input promise', function(done) {
        return well(well.resolve(true)).then(
            function(val) {
                t.ok(val);
                done();
            },
            t.fail
        );
    });

    it('should assimilate untrusted promises', function () {
        var untrusted, result;

        // unstrusted promise should never be returned by well()
        untrusted = new FakePromise();
        result = well(untrusted);

        t.notEqual(result, untrusted);
        t.notOk(result instanceof FakePromise);
    });

    it('should assimilate intermediate promises returned by callbacks', function (done) {
        var plan = t.plan(2, done);
        var result;

        // untrusted promise returned by an intermediate
        // handler should be assimilated
        result = well(1,
            function (val) {
                return new FakePromise(val + 1);
            }
        ).then(
            function (val) {
                t.strictEqual(val, 2);
                plan.check();
            },
            t.fail
        );

        t.notOk(result instanceof FakePromise);
        plan.check();
    });

    it('should assimilate intermediate promises and forward results', function (done) {
        var untrusted, result;

        untrusted = new FakePromise(1);

        result = well(untrusted, function (val) {
            return new FakePromise(val + 1);
        });

        t.notEqual(result, untrusted);
        t.notOk(result instanceof FakePromise);

        return well(result,
            function (val) {
                t.strictEqual(val, 2);
                return new FakePromise(val + 1);
            }
        ).then(
            function (val) {
                t.strictEqual(val, 3);
                done();
            },
            t.fail
        );
    });


});