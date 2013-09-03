var utils = require('./utils');
var d = utils.d;
var defineProperty = Object.defineProperty;

module.exports = function (options) {

    function makePromise() {
        lift.extend = extend;
        lift.resolve = resolve;
        lift.reject = reject;
        lift.promise = newPromise;
        lift.isPromise = isPromise;
        return lift;
        function lift(value) {
            return resolve(value);
        }
    }


    /**
     * Returns a resolved promise. The returned promise well be
     *  - fulfilled with promiseOrValue if it is a value, or
     *  - if promiseOrValue is a promise
     *    - fulfilled with promiseOrValue's value after it is fulfilled
     *    - rejected with promiseOrValue's reason after it is rejected
     * @param  {*} promiseOrValue
     * @return {Promise}
     */
    function resolve(promiseOrValue) {
        if (isPromise(promiseOrValue)) return newPromise(function (resolve) {
            resolve(promiseOrValue);
        });
        return newFulfilledPromise(promiseOrValue);
    }

    /**
     * Returns a rejected promise for the supplied promiseOrValue.  The returned
     * promise well be rejected with:
     * - promiseOrValue, if it is a value, or
     * - if promiseOrValue is a promise
     *   - promiseOrValue's value after it is fulfilled
     *   - promiseOrValue's reason after it is rejected
     * @param {*} promiseOrValue the rejected value of the returned {@link Promise}
     * @return {Promise} rejected {@link Promise}
     */
    function reject(promiseOrValue) {
        if (isPromise(promiseOrValue))return newPromise(function (resolve, reject) {
            reject(promiseOrValue);
        });
        return newRejectedPromise(promiseOrValue);
    }

    function newPromise(resolver, cancel) {
        var promise = function () {
        };
        promise.__proto__ = PromiseUnresolved;
        if (cancel) promise.cancel = cancel;
        if (resolver) resolver(promiseResolve(promise), promiseReject(promise), promiseNotify(promise));
        return promise;
    }

    function newResolvedPromise(state, value) {
        var promise = function () {
        };
        promise.__proto__ = PromiseResolved;
        promise.state = state;
        promise.value = value;
        return promise;
    }

    function newFulfilledPromise(value) {
        return newResolvedPromise(states.fulfilled, value);
    }

    function newRejectedPromise(value) {
        return newResolvedPromise(states.rejected, value);
    }

    function extend(api) {
        api = Object(api) === api ? api : {};
        Object.keys(api).forEach(function (key) {
            if (typeof api[key] === 'function') {
                defineProperty(PromiseResolved, key, d(api[key]));
                defineProperty(PromiseUnresolved, key, d(api[key]));
            }
        });
        return this;
    }

    var PromiseResolved, PromiseUnresolved;

    PromiseResolved = Object.create(Function.prototype, {
        resolved: d(true),
        then: d(function then(onFulfilled, onRejected, onProgress) {
            /*jshint unused:false*/
            var value = invoke(this.state, this.value, arguments);
            if (isPromise(value)) return resolve(value);
            return newResolvedPromise(this.state, value);
        }),

        done: d(function done(onFulfilled, onRejected, onProgress) {
            /*jshint unused:false*/
            invoke(this.state, this.value, arguments);
        })
    });

    PromiseUnresolved = Object.create(Function.prototype, {

        then: d(function (onFulfilled, onRejected, onProgress) {
            var self = this,
                args = arguments;
            return newPromise(function (resolve, reject, notify) {
                deliver(self, args, [resolve, reject, notify]);
            }, this.cancel);
        }),

        done: d(function (onFulfilled, onRejected, onProgress) {
            deliver(this, arguments);
        })

    });

    function promiseResolve(promise) {
        return function (value) {
            promiseResolveOrReject(promise, states.fulfilled, value);
        }
    }

    function promiseReject(promise) {
        return function (reason) {
            promiseResolveOrReject(promise, states.rejected, reason);
        }
    }

    function promiseNotify(promise) {
        return function (update) {
            if (promise.__consumers) {
                scheduleConsumers(promise.__consumers, states.pending, update);
            }
        }
    }

    function promiseResolveOrReject(promise, state, value) {
        if (promise.resolved) return;

        if (isPromise(value)) {
            value.then(promiseResolve(promise), promiseReject(promise), promiseNotify(promise));
        } else {
            scheduleConsumers(promise.__consumers, state, value);
            promise.__proto__ = PromiseResolved;
            promise.value = value;
            promise.state = state;
        }
    }

    function deliver(promise, handlers, resolvers) {
        if (!promise.__consumers) promise.__consumers = [];
        return promise.__consumers.push(invokeAll);

        function invokeAll(state, value) {
            var v = invoke(state, value, handlers);
            if (resolvers) isPromise(v) ? v.then(resolvers[0], resolvers[1], resolvers[2]) : invoke(state, v, resolvers);
        }
    }

    function invoke(state, value, handlers) {
        var fn, i = toIndex[state];
        if (i >= handlers.length) return value;
        return (handlers && (fn = handlers[i]) && (typeof fn === "function")) ? fn(value) : value;
    }


    /**
     * Schedule a task that well process a list of handlers
     * in the next queue drain run.
     * @private
     * @param {Array} handlers queue of handlers to execute
     * @param {Function} promise
     */
    function scheduleConsumers(handlers, state, value) {
        if (!handlers) return;
        var handler, i = 0;
        while (handler = handlers[i++]) {
            handler(state, value);
        }
    }

    return makePromise();
};

/**
 * Determines if promiseOrValue is a promise or not
 *
 * @param {*} promiseOrValue anything
 * @returns {boolean} true if promiseOrValue is a {@link Promise}
 */
function isPromise(promiseOrValue) {
    return promiseOrValue && typeof promiseOrValue.then === 'function';
}

var states = {
    "fulfilled": "fulfilled",
    "rejected": "rejected",
    "pending": "pending"
};
var toIndex = {
    "fulfilled": 0,
    "rejected": 1,
    "pending": 2
};