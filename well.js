"use strict";

module.exports = well;

var promise, resolve, reject, isPromise, undef;

var _promise = makeWellCore(require('./lib/promise'));

well.promise = promise = _promise.promise;
well.resolve = resolve = _promise.resolve;
well.reject = reject = _promise.reject;
well.defer = defer;

well.isPromise = isPromise = _promise.isPromise;

well.extend = _promise.extend;

function makeWellCore(makePromise) {
    return makePromise({
        // placeholder for options
    }).extend({
        /**
         * Applies f to the promise's eventual value.
         * @param {function} f function to apply
         * @returns {Promise} promise for the return value of applying f
         *  to this promise's value
         */
        map: function (f) {
            return this.then(f);
        },

        /**
         * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
         * @param {function?} onRejected
         * @return {Promise}
         */
        otherwise: function (onRejected) {
            return this.then(undef, onRejected);
        },

        /**
         * Ensures that onFulfilledOrRejected will be called regardless of whether
         * this promise is fulfilled or rejected.  onFulfilledOrRejected WILL NOT
         * receive the promises' value or reason.  Any returned value will be disregarded.
         * onFulfilledOrRejected may throw or return a rejected promise to signal
         * an additional error.
         * @param {function} onFulfilledOrRejected handler to be called regardless of
         *  fulfillment or rejection
         * @returns {Promise}
         */
        ensure: function (onFulfilledOrRejected) {
            return this.then(injectHandler, injectHandler)['yield'](this);

            function injectHandler() {
                return onFulfilledOrRejected();
            }
        },

        /**
         * Shortcut for .then(function() { return value; })
         * @param  {*} value
         * @return {Promise} a promise that:
         *  - is fulfilled if value is not a promise, or
         *  - if value is a promise, will fulfill with its value, or reject
         *    with its reason.
         */
        'yield': function (value) {
            return this.then(function () {
                return value;
            });
        },

        /**
         * Runs a side effect when this promise fulfills, without changing the
         * fulfillment value.
         * @param {function} onFulfilledSideEffect
         * @returns {Promise}
         */
        tap: function (onFulfilledSideEffect) {
            return this.then(onFulfilledSideEffect)['yield'](this);
        },

        /**
         * Handles asynchronous function style callback (which is run in next event loop
         * the earliest). Returns self promise. Callback is optional.
         *
         * Useful when we want to configure typical asynchronous function which logic is
         * internally configured with promises.
         *
         * Extension can be used as follows:
         *
         * var foo = function (arg1, arg2, cb) {
         *     var d = well.defer();
         *     // ... implementation
         *     return d.promise.cb(cb);
         * };
         *
         * @param {Function} cb extension returns promise and handles eventual callback (optional)
         * @returns {Promise}
         */
        cb: function (cb) {
            return this.then(function (value) {
                cb(null, value);
            }, function (err) {
                cb(err);
            });
        }
    });
}
/**
 * Register an observer for a promise or immediate value.
 *
 * @param {*} promiseOrValue
 * @param {function?} [onFulfilled] callback to be called when promiseOrValue is
 *   successfully fulfilled.  If promiseOrValue is an immediate value, callback
 *   well be invoked immediately.
 * @param {function?} [onRejected] callback to be called when promiseOrValue is
 *   rejected.
 * @param {function?} [onProgress] callback to be called when progress updates
 *   are issued for promiseOrValue.
 * @returns {Promise} a new {@link Promise} that well complete with the return
 *   value of callback or errback or the completion value of promiseOrValue if
 *   callback and/or errback is not supplied.
 */
function well(promiseOrValue, onFulfilled, onRejected, onProgress) {
    // Get a trusted promise for the input promiseOrValue, and then
    // register promise handlers
    var promise = resolve(promiseOrValue);
    if (arguments.length > 1) {
        promise = promise.then(onFulfilled, onRejected, onProgress);
    }
    return promise;
}

function defer(canceler) {
    var deferred, pending, resolved, cancel;

    deferred = {
        promise: undef, resolve: undef, reject: undef, notify: undef,
        resolver: { resolve: undef, reject: undef, notify: undef }
    };

    if (canceler) {
        deferred.cancel = cancel = function (reason) {
            return deferred.reject(canceler(reason));
        };
    }

    deferred.promise = pending = promise(makeDeferred, cancel);

    return deferred;

    function makeDeferred(resolvePending, rejectPending, notifyPending) {
        deferred.resolve = deferred.resolver.resolve = function (value) {
            if (resolved) {
                return resolve(value);
            }
            resolved = true;
            resolvePending(value);
            return pending;
        };

        deferred.reject = deferred.resolver.reject = function (reason) {
            if (resolved) {
                return reject(reason);
            }
            resolved = true;
            rejectPending(reason);
            return pending;
        };

        deferred.notify = deferred.resolver.notify = function (update) {
            notifyPending(update);
            return update;
        };
    }
}