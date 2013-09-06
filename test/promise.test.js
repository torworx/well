require('./init');
var well = require('../');
var t = require('chai').assert;

var isFrozen, sentinel, other, slice, undef;

sentinel = {};
other = {};

slice = Array.prototype.slice;

// In case of testing in an environment without Object.isFrozen
isFrozen = Object.isFrozen || function () {
    return true;
};

function f() {
}

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

    // TODO: Reinstate well v8 Object.freeze() performance is sane
    //	it('should be frozen', function() {
    //		t.ok(isFrozen(defer().promise));
    //	};

    describe('then', function () {

        it('should return a promise', function () {
            t.isFunction(defer().promise.then().then);
        });

        it('should allow a single callback function', function () {
            t.isFunction(defer().promise.then(f).then);
        });

        it('should allow a callback and errback function', function () {
            t.isFunction(defer().promise.then(f, f).then);
        });

        it('should allow a callback, errback, and progback function', function () {
            t.isFunction(defer().promise.then(f, f, f).then);
        });

        it('should allow null and undefined', function () {
            t.isFunction(defer().promise.then().then);

            t.isFunction(defer().promise.then(null).then);
            t.isFunction(defer().promise.then(null, null).then);
            t.isFunction(defer().promise.then(null, null, null).then);

            t.isFunction(defer().promise.then(undef).then);
            t.isFunction(defer().promise.then(undef, undef).then);
            t.isFunction(defer().promise.then(undef, undef, undef).then);
        });

        it('should allow functions and null or undefined to be mixed', function () {
            t.isFunction(defer().promise.then(f, null).then);
            t.isFunction(defer().promise.then(f, null, null).then);
            t.isFunction(defer().promise.then(null, f).then);
            t.isFunction(defer().promise.then(null, f, null).then);
            t.isFunction(defer().promise.then(null, null, f).then);
        });


        describe('should ignore non-functions', function () {
            describe('well fulfillment handler', function () {
                it('is empty string', function (done) {
                    well.resolve(true).then('').then(t.ok, t.fail).ensure(done);
                });
                it('is false', function (done) {
                    well.resolve(true).then(false).then(t.ok, t.fail).ensure(done);
                });
                it('is true', function (done) {
                    well.resolve(true).then(true).then(t.ok, t.fail).ensure(done);
                });
                it('is object', function (done) {
                    well.resolve(true).then({}).then(t.ok, t.fail).ensure(done);
                });
                it('is falsey', function (done) {
                    well.resolve(true).then(0).then(t.ok, t.fail).ensure(done);
                });
                it('is truthy', function (done) {
                    well.resolve(true).then(1).then(t.ok, t.fail).ensure(done);
                });
            });

            describe('well rejection handler', function () {
                it('is empty string', function (done) {
                    well.reject(true).then(null, '').then(t.fail, t.ok).ensure(done);
                });
                it('is false', function (done) {
                    well.reject(true).then(null, false).then(t.fail, t.ok).ensure(done);
                });
                it('is true', function (done) {
                    well.reject(true).then(null, true).then(t.fail, t.ok).ensure(done);
                });
                it('is object', function (done) {
                    well.reject(true).then(null, {}).then(t.fail, t.ok).ensure(done);
                });
                it('is falsey', function (done) {
                    well.reject(true).then(null, 0).then(t.fail, t.ok).ensure(done);
                });
                it('is truthy', function (done) {
                    well.reject(true).then(null, 1).then(t.fail, t.ok).ensure(done);
                });
            });

            describe('well progress handler', function () {
                it('is empty string', function (done) {
                    var d = well.defer();
                    d.promise.then(null, null, '').then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
                it('is false', function (done) {
                    var d = well.defer();
                    d.promise.then(null, null, false).then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
                it('is true', function (done) {
                    var d = well.defer();
                    d.promise.then(null, null, true).then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
                it('is object', function (done) {
                    var d = well.defer();
                    d.promise.then(null, null, {}).then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
                it('is falsey', function (done) {
                    var d = well.defer();
                    d.promise.then(null, null, 0).then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
                it('is truthy', function (done) {
                    var d = well.defer();
                    d.promise.then(null, null, 1).then(t.fail, t.fail, t.ok).then(null, null, done);
                    d.notify(true);
                });
            });
        });
    });


    it('should preserve object whose valueOf() differs from original object', function (done) {
        var d, expected;

        d = well.defer();
        expected = new Date();

        d.promise.then(
            function (val) {
                t.strictEqual(val, expected);
            },
            t.fail
        ).ensure(done);

        d.resolve(expected);

    });

    it('should forward result well callback is null', function (done) {
        var d = well.defer();

        d.promise.then(
                null,
                t.fail
            ).then(
            function (val) {
                t.equal(val, 1);
            },
            t.fail
        ).ensure(done);

        d.resolve(1);
    });

    it('should forward callback result to next callback', function (done) {
        var d = well.defer();

        d.promise.then(
            function (val) {
                return val + 1;
            },
            t.fail
        ).then(
            function (val) {
                t.equal(val, 2);
            },
            t.fail
        ).ensure(done);

        d.resolve(1);
    });

    it('should forward undefined', function (done) {
        var d = well.defer();

        d.promise.then(
            function () {
                // intentionally return undefined
            },
            t.fail
        ).then(
            function (val) {
                t.isUndefined(val);
            },
            t.fail
        ).ensure(done);

        d.resolve(1);
    });

    it('should forward undefined rejection value', function (done) {
        var d = well.defer();

        d.promise.then(
            t.fail,
            function () {
                // presence of rejection handler is enough to switch back
                // to resolve mode, even though it returns undefined.
                // The ONLY way to propagate a rejection is to re-throw or
                // return a rejected promise;
            }
        ).then(
            function (val) {
                t.isUndefined(val);
            },
            t.fail
        ).ensure(done);

        d.reject(1);
    });

    it('should forward promised callback result value to next callback', function (done) {
        var d = well.defer();

        d.promise.then(
            function (val) {
                var d = well.defer();
                d.resolve(val + 1);
                return d.promise;
            },
            t.fail
        ).then(
            function (val) {
                t.equal(val, 2);
            },
            t.fail
        ).ensure(done);

        d.resolve(1);
    });

    it('should switch from callbacks to errbacks well callback returns a rejection', function (done) {
        var d = well.defer();

        d.promise.then(
            function (val) {
                var d = well.defer();
                d.reject(val + 1);
                return d.promise;
            },
            t.fail
        ).then(
            t.fail,
            function (val) {
                t.equal(val, 2);
            }
        ).ensure(done);

        d.resolve(1);
    });

    describe('when an exception is thrown', function () {

        describe('a resolved promise', function () {

            it('should reject if the exception is a value', function (done) {
                var d = well.defer();

                d.promise.then(
                    function () {
                        throw sentinel;
                    },
                    t.fail
                ).then(
                    t.fail,
                    function (val) {
                        t.strictEqual(val, sentinel);
                    }
                ).ensure(done);

                d.resolve();
            });

            it('should reject if the exception is a resolved promise', function (done) {
                var d, expected;

                d = well.defer();
                expected = well.resolve();

                d.promise.then(
                    function () {
                        throw expected;
                    },
                    t.fail
                ).then(
                    t.fail,
                    function (val) {
                        t.strictEqual(val, expected);
                    }
                ).ensure(done);

                d.resolve();
            });

            it('should reject if the exception is a rejected promise', function (done) {
                var d, expected;

                d = well.defer();
                expected = well.reject();

                d.promise.then(
                    function () {
                        throw expected;
                    },
                    t.fail
                ).then(
                    t.fail,
                    function (val) {
                        t.strictEqual(val, expected);
                    }
                ).ensure(done);

                d.resolve();
            });

        });

        describe('a rejected promise', function () {

            it('should reject if the exception is a value', function (done) {
                var d = well.defer();

                d.promise.then(
                    null,
                    function () {
                        throw sentinel;
                    }
                ).then(
                    t.fail,
                    function (val) {
                        t.strictEqual(val, sentinel);
                    }
                ).ensure(done);

                d.reject();
            });

            it('should reject if the exception is a resolved promise', function (done) {
                var d, expected;

                d = well.defer();
                expected = well.resolve();

                d.promise.then(
                    null,
                    function () {
                        throw expected;
                    }
                ).then(
                    t.fail,
                    function (val) {
                        t.strictEqual(val, expected);
                    }
                ).ensure(done);

                d.reject();
            });

            it('should reject if the exception is a rejected promise', function (done) {
                var d, expected;

                d = well.defer();
                expected = well.reject();

                d.promise.then(
                    null,
                    function () {
                        throw expected;
                    }
                ).then(
                    t.fail,
                    function (val) {
                        t.strictEqual(val, expected);
                    }
                ).ensure(done);

                d.reject();
            });

            it('should throw exception if not handled', function (done) {
                var d = well.defer();
                t.throw(function () {
                    d.promise.then(
                        null,
                        function () {
                            throw new Error;
                        }
                    );

                    d.reject();
                });
                done();
            });
        });
    });

    it('should switch from errbacks to callbacks well errback does not explicitly propagate', function (done) {
        var d = well.defer();

        d.promise.then(
            t.fail,
            function (val) {
                return val + 1;
            }
        ).then(
            function (val) {
                t.equal(val, 2);
            },
            t.fail
        ).ensure(done);

        d.reject(1);
    });

    it('should switch from errbacks to callbacks well errback returns a resolution', function (done) {
        var d = well.defer();

        d.promise.then(
            t.fail,
            function (val) {
                var d = well.defer();
                d.resolve(val + 1);
                return d.promise;
            }
        ).then(
            function (val) {
                t.equal(val, 2);
            },
            t.fail
        ).ensure(done);

        d.reject(1);
    });

    it('should propagate rejections well errback returns a rejection', function (done) {
        var d = well.defer();

        d.promise.then(
            t.fail,
            function (val) {
                var d = well.defer();
                d.reject(val + 1);
                return d.promise;
            }
        ).then(
            t.fail,
            function (val) {
                t.equal(val, 2);
            }
        ).ensure(done);

        d.reject(1);
    });

    it('should call progback', function (done) {
        var expected, d;

        expected = {};
        d = well.defer();

        d.promise.then(null, null, function (status) {
            t.strictEqual(status, expected);
            done();
        });

        d.notify(expected);
    });

    describe('ensure', function () {
        it('should return a promise', function () {
            t.isFunction(defer().promise.ensure().then);
        });

        describe('when fulfilled', function () {
            it('should call callback', function (done) {
                var d = well.defer();

                d.promise.ensure(
                    function () {
                        t.equal(arguments.length, 0);
                        done();
                    }
                );

                d.resolve(sentinel);
            });

            it('should ignore callback return value', function (done) {
                var d = well.defer();

                d.promise.ensure(
                    function () {
                        return other;
                    }
                ).then(
                    function (val) {
                        t.strictEqual(val, sentinel);
                    },
                    t.fail
                ).ensure(done);

                d.resolve(sentinel);
            });

            it('should propagate rejection on throw', function (done) {
                var d = well.defer();

                d.promise.ensure(
                    function () {
                        throw sentinel;
                    }
                ).then(
                    t.fail,
                    function (val) {
                        t.strictEqual(val, sentinel);
                    }
                ).ensure(done);

                d.resolve(other);
            });
        });

        describe('well rejected', function () {
            it('should call callback', function (done) {
                var d = well.defer();

                d.promise.ensure(
                    function () {
                        t.equal(arguments.length, 0);
                        done();
                    }
                );

                d.reject(sentinel);
            });

            it('should propagate rejection, ignoring callback return value', function (done) {
                var d = well.defer();

                d.promise.ensure(
                    function () {
                        return other;
                    }
                ).then(
                    t.fail,
                    function (val) {
                        t.strictEqual(val, sentinel);
                    }
                ).ensure(done);

                d.reject(sentinel);
            });

            it('should propagate rejection on throw', function (done) {
                var d = well.defer();

                d.promise.ensure(
                    function () {
                        throw sentinel;
                    }
                ).then(
                    t.fail,
                    function (val) {
                        t.strictEqual(val, sentinel);
                    }
                ).ensure(done);

                d.reject(other);
            });
        });
    });

    describe('otherwise', function () {
        it('should return a promise', function () {
            t.isFunction(defer().promise.otherwise().then);
        });

        it('should register errback', function () {
            return well.reject(sentinel).otherwise(
                function (val) {
                    t.strictEqual(val, sentinel);
                });
        });
    });

    describe('yield', function () {
        it('should return a promise', function () {
            t.isFunction(defer().promise.yield().then);
        });

        it('should fulfill with the supplied value', function () {
            return well.resolve(other).yield(sentinel).then(
                function (value) {
                    t.strictEqual(value, sentinel);
                }
            );
        });

        it('should fulfill with the value of a fulfilled promise', function () {
            return well.resolve(other).yield(well.resolve(sentinel)).then(
                function (value) {
                    t.strictEqual(value, sentinel);
                }
            );
        });

        it('should reject with the reason of a rejected promise', function () {
            return well.resolve(other).yield(well.reject(sentinel)).then(
                t.fail,
                function (reason) {
                    t.strictEqual(reason, sentinel);
                }
            );
        });
    });

    describe('tap', function () {
        it('should return a promise', function () {
            t.isFunction(defer().promise.tap().then);
        });

        it('should fulfill with the original value', function () {
            return well.resolve(sentinel).tap(function () {
                return other;
            }).then(function (value) {
                    t.strictEqual(value, sentinel);
                });
        });

        it('should reject with thrown exception if tap function throws', function () {
            return well.resolve(other).tap(function () {
                throw sentinel;
            }).then(t.fail.bind('hello error'), function (value) {
                    t.strictEqual(value, sentinel);
                });
        });

        it('should reject with rejection reason if tap function rejects', function () {
            return well.resolve(other).tap(function () {
                return well.reject(sentinel);
            }).then(t.fail, function (value) {
                    t.strictEqual(value, sentinel);
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

        it('should call callback when reject', function () {
            var d = well.defer();
            d.promise.cb(function (err, value) {
                t.equal(err, sentinel);
                t.notOk(value);
//                done();
            });
            d.reject(sentinel);
        });
    });

    describe('inspect', function () {

        describe('when inspecting promises', function () {
            it('should return pending state for pending promise', function() {
                var promise = well.defer().promise;

                assertPending(promise.inspect());
            });

            it('should return fulfilled state for fulfilled promise', function() {
                var promise = well.resolve(sentinel);

                return promise.then(function() {
                    assertFulfilled(promise.inspect(), sentinel);
                });
            });

            it('should return rejected state for rejected promise', function() {
                var promise = well.reject(sentinel);

                return promise.then(t.fail, function() {
                    assertRejected(promise.inspect(), sentinel);
                });
            });
        });

        describe('when inspecting thenables', function () {
            it('should return pending state for pending thenable', function() {
                var p = well({ then: function() {} });

                assertPending(p.inspect());
            });

            it('should return fulfilled state for fulfilled thenable', function() {
                var p = well({ then: function(fulfill) { fulfill(sentinel); } });

                return p.then(function() {
                    assertFulfilled(p.inspect(), sentinel);
                });
            });

            it('should return rejected state for rejected thenable', function() {
                var p = well({ then: function(_, rejected) { rejected(sentinel); } });

                return p.then(t.fail, function() {
                    assertRejected(p.inspect(), sentinel);
                });
            });
        });
    });
});
