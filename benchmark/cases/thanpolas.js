"use strict";

/**
 * This performance test is rewrite from: http://thanpol.as/javascript/promises-a-performance-hits-you-should-be-aware-of/
 * and the git repository: https://github.com/thanpolas/perf-promises
 */

var Benchmark = require('../benchmark');
var vendors = require('../vendors');
var utils = require('../utils');
var async = require('async');

var nextTick = utils.nextTick;

var benchmark = Benchmark('Promises Performance test by thanpolas', {total: true});

var MODE  = {
    SYNC: 'sync',
    MIXED: 'mixed',
    ASYNC: 'async'
};

var mode = MODE.ASYNC;

// Base async test
benchmark.add('async', testAsync(mode));
// Promise vendor test
Object.keys(vendors).forEach(function (name) {
    if (!vendors[name].all) return;
    benchmark.add(name, testPromises(vendors[name], mode));
});

benchmark.run(500, 20);

function testAsync(mode) {
    return function (count, complete, test) {
        var tasks = [], i = 0;
        while(i++ < count) createTask(tasks, i);
        if (test.running) {
            test._ptime.log('after for');
        }
        async.parallel(tasks, complete);

        function createTask(tasks, index) {
            tasks.push(function (callback) {
                if (test.running) {
                    test._ptime.log('create promise:' + index);
                }
                vanilla(mode, function () {
                    if (test.running) {
                        if (!test._key_time) {
                            test._key_time = test._ptime.log('KEY_TIME');
                        } else {
                            test._ptime.log('callback resolved:' + index);
                        }
                    }
                }, callback);
            });
        }
    }
}

function testPromises(vendor, mode) {
    return function (count, complete, test) {
        var promises = [], i = 0, p;

        while(i++ < count) createPromise(promises, i);

        setTimeout(function () {
            vendor.all(promises)
                .then(complete, console.error)
                .then(utils.noop, console.error);
        }, 0);

        function createPromise(promises, index) {
            setTimeout(function () {
                if (test.running) {
                    test._ptime.log('create promise:' + i);
                }
                p = promise(vendor, mode);
                promises.push(p);
                p.then(function () {
                    if (test.running) {
                        if (!test._key_time) {
                            test._key_time = test._ptime.log('KEY_TIME');
                        } else {
                            test._ptime.log('promise resolved:' + index);
                        }
                    }
                }, console.err);
            }, 0);
        }
    }
}

function vanilla(mode, intercept, cb) {
    // the final stub function in the chain
    function do7() {
        intercept();

        if (MODE.SYNC === mode) {
            cb();
        } else {
            nextTick(cb);
        }
    }

    var fndo6, fndo5, fndo4, fndo3, fndo2;
    switch (mode) {
        case MODE.SYNC:
            fndo6 = function do6() { do7(); };
            fndo5 = function do5() { fndo6(); };
            fndo4 = function do4() { fndo5(); };
            fndo3 = function do3() { fndo4(); };
            fndo2 = function do2() { fndo3(); };
            fndo2();
            break;
        case MODE.MIXED:
            fndo6 = function do6() { nextTick(do7); };
            fndo5 = function do5() { nextTick(fndo6); };
            fndo4 = function do4() { fndo5(); };
            fndo3 = function do3() { fndo4(); };
            fndo2 = function do2() { fndo3(); };
            fndo2();
            break;
        case MODE.ASYNC:
            fndo6 = function do6() { nextTick(do7); };
            fndo5 = function do5() { nextTick(fndo6); };
            fndo4 = function do4() { nextTick(fndo5); };
            fndo3 = function do3() { nextTick(fndo4); };
            fndo2 = function do2() { nextTick(fndo3); };
            nextTick(fndo2);
            break;
    }
}

function promise(vendor, mode) {
    var def = vendor.defer();
    var def2 = vendor.defer();
    var def3 = vendor.defer();
    var def4 = vendor.defer();
    var def5 = vendor.defer();
    var def6 = vendor.defer();
    var def7 = vendor.defer();

    var sync = MODE.SYNC === mode;
    var mixed = MODE.MIXED === mode;

    function doResolve(_def, optMixed) {
        return function(){
            if (sync || (mixed && !optMixed)) {
                _def.resolve();
            } else {
                nextTick(_def.resolve);
            }
        };
    }

    // chain them
    def7.promise.then(doResolve(def6))
        .then(doResolve(def5))
        .then(doResolve(def4))
        .then(doResolve(def3, true))
        .then(doResolve(def2, true))
        .then(doResolve(def, true));


    if (sync) {
        def7.resolve();
    } else {
        nextTick(def7.resolve);
    }
    return def.promise;
}