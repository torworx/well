"use strict";

require('./init');
var t = require('chai').assert;
var fn = require('../function');
var well = require('../');

var fail, slice, sentinel;

fail = t.fail;
slice = [].slice;

sentinel = { value: 'sentinel' };

describe('well/function-test', function () {


    function assertIsPromise(something) {
        var message = 'Object is not a promise';
        t.ok(well.isPromiseLike(something), message);
    }

    function functionThatThrows(error) {
        return function throwing() {
            throw error;
        };
    }

    function f(x, y) {
        return x + y;
    }

    // Use instead of Function.prototype.bind, since we need to test in envs that don't support it
    function partial(f) {
        var partialArgs = slice.call(arguments, 1);
        return function () {
            return f.apply(null, partialArgs.concat(slice.call(arguments)));
        };
    }

    describe('well/function', function () {

        describe('apply', function () {
            it('should return a promise', function () {
                var result = fn.apply(f, [1, 2]);
                assertIsPromise(result);
            });

            it('should preserve thisArg', function () {
                return fn.apply.call(sentinel, function () {
                    t.strictEqual(this, sentinel);
                });
            });

            it('should accept values for arguments', function (done) {
                var result = fn.apply(f, [1, 2]);
                return well(result,function (result) {
                    t.equal(result, 3);
                }).ensure(done);
            });

            it('should accept promises for arguments', function (done) {
                var result = fn.apply(f, [well(1), 2]);
                return well(result,function (result) {
                    t.equal(result, 3);
                }).ensure(done);
            });

            it('should consider the arguments optional', function (done) {
                function countArgs() {
                    return arguments.length;
                }

                fn.apply(countArgs).then(function (argCount) {
                    t.equal(argCount, 0);
                }, fail).ensure(done);
            });

            it('should reject the promise when the function throws', function (done) {
                var error = new Error();
                var throwingFn = functionThatThrows(error);

                fn.apply(throwingFn).then(fail,function (reason) {
                    t.strictEqual(reason, error);
                }).ensure(done);
            });

            it('should maintain promise flattening semantics', function (done) {
                function returnsPromise(val) {
                    return well.resolve(10 + val);
                }

                fn.apply(returnsPromise, [5]).then(function (value) {
                    t.equal(value, 15);
                }, fail).ensure(done);
            });
        });

        describe('call', function () {
            it('should return a promise', function () {
                var result = fn.call(f, 1, 2);
                assertIsPromise(result);
            });

            it('should preserve thisArg', function () {
                return fn.call.call(sentinel, function () {
                    t.strictEqual(this, sentinel);
                });
            });

            it('should accept values for arguments', function (done) {
                var result = fn.call(f, 1, 2);
                return well(result,function (result) {
                    t.equal(result, 3);
                }).ensure(done);
            });

            it('should accept promises for arguments', function (done) {
                var result = fn.call(f, well(1), 2);
                return well(result,function (result) {
                    t.equal(result, 3);
                }).ensure(done);
            });

            it('should consider the arguments optional', function (done) {
                function countArgs() {
                    return arguments.length;
                }

                fn.call(countArgs).then(function (argCount) {
                    t.equal(argCount, 0);
                }, fail).ensure(done);
            });

            it('should reject the promise when the function throws', function (done) {
                var error = new Error();
                var throwingFn = functionThatThrows(error);

                fn.call(throwingFn).then(fail,function (reason) {
                    t.strictEqual(reason, error);
                }).ensure(done);
            });

            it('should maintain promise flattening semantics', function (done) {
                function returnsPromise(val) {
                    return well.resolve(10 + val);
                }

                fn.call(returnsPromise, 5).then(function (value) {
                    t.equal(value, 15);
                }, fail).ensure(done);
            });
        });

        describe('bind', function () {
            it('should be an alias for lift', function () {
                t.strictEqual(fn.bind, fn.lift);
            });
        });

        describe('lift', function () {
            it('should return a function', function () {
                t.isFunction(fn.lift(f, null));
            });

            describe('the returned function', function () {
                it('should return a promise', function () {
                    var result = fn.lift(f);
                    assertIsPromise(result(1, 2));
                });

                it('should preserve thisArg', function () {
                    return fn.lift(function () {
                        t.strictEqual(this, sentinel);
                    }).call(sentinel);
                });

                it('should resolve the promise to its return value', function (done) {
                    var result = fn.lift(f);
                    result(1, 2).then(function (value) {
                        t.equal(value, 3);
                    }, fail).ensure(done);
                });

                it('should accept promises for arguments', function (done) {
                    var result = fn.lift(f);

                    result(1, well(2)).then(function (value) {
                        t.equal(value, 3);
                    }, fail).ensure(done);
                });

                it('should reject the promise upon error', function (done) {
                    var error = new Error();
                    var throwingFn = functionThatThrows(error);

                    var result = fn.lift(throwingFn);
                    result().then(fail,function (reason) {
                        t.strictEqual(reason, error);
                    }).ensure(done);
                });
            });

            it('should accept leading arguments', function (done) {
                var partiallyApplied = fn.lift(f, 5);

                partiallyApplied(10).then(function (value) {
                    t.equal(value, 15);
                }, fail).ensure(done);
            });

            it('should accept promises as leading arguments', function (done) {
                var partiallyApplied = fn.lift(f, well(5));

                partiallyApplied(10).then(function (value) {
                    t.equal(value, 15);
                }, fail).ensure(done);
            });
        });

        describe('compose', function () {
            it('should return a function', function () {
                var result = fn.compose(f);
                t.isFunction(result);
            });

            describe('the returned function', function () {
                it('should return a promise', function () {
                    var returnedFunction = fn.compose(f);
                    var result = returnedFunction();

                    assertIsPromise(result);
                });

                it('should be composed from the passed functions', function (done) {
                    var sumWithFive = partial(f, 5);
                    var sumWithTen = partial(f, 10);

                    var composed = fn.compose(sumWithFive, sumWithTen);
                    composed(15).then(function (value) {
                        t.equal(value, 30);
                    }, fail).ensure(done);
                });

                it('should pass all its arguments to the first function', function (done) {
                    var sumWithFive = partial(f, 5);

                    var composed = fn.compose(f, sumWithFive);
                    composed(10, 15).then(function (value) {
                        t.equal(value, 30);
                    }, fail).ensure(done);
                });

                it('should accept promises for arguments', function (done) {
                    var sumWithFive = partial(f, 5);

                    var composed = fn.compose(f, sumWithFive);
                    composed(well(10), 15).then(function (value) {
                        t.equal(value, 30);
                    }, fail).ensure(done);
                });

                it('should be transparent to returned promises', function (done) {
                    var sumWithTen = partial(f, 10);

                    var promisingSumWithTen = function (arg) {
                        return well.resolve(sumWithTen(arg));
                    };

                    var composed = fn.compose(sumWithTen, promisingSumWithTen);
                    composed(10).then(function (value) {
                        t.equal(value, 30);
                    }, fail).ensure(done);
                });

                it('should reject when the first function throws', function (done) {
                    var error = new Error('Exception should be handled');
                    var throwing = functionThatThrows(error);

                    var composed = fn.compose(throwing, f);
                    composed(5, 10).then(fail,function (reason) {
                        t.strictEqual(reason, error);
                    }).ensure(done);
                });

                it('should reject when a composed function throws', function (done) {
                    var error = new Error('Exception should be handled');
                    var throwing = functionThatThrows(error);

                    var composed = fn.compose(f, throwing);
                    composed(5, 10).then(fail,function (reason) {
                        t.strictEqual(reason, error);
                    }).ensure(done);
                });

                it('should reject if a composed function rejects', function (done) {
                    var rejecting = function () {
                        return well.reject('rejected');
                    };

                    var composed = fn.compose(f, rejecting);
                    composed(5, 10).then(fail,function (reason) {
                        t.equal(reason, 'rejected');
                    }).ensure(done);
                });
            });

            it('should compose the functions on the given order', function (done) {
                function a(str) {
                    return str + ' is';
                }

                function b(str) {
                    return str + ' really';
                }

                function c(str) {
                    return str + ' awesome!';
                }

                var composed = fn.compose(a, b, c);

                composed('well.js').then(function (value) {
                    t.equal(value, 'well.js is really awesome!');
                }, fail).ensure(done);
            });
        });
    });
});