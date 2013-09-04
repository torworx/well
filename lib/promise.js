var utils = require('./utils');
var d = utils.d;
var defineProperty = Object.defineProperty;

module.exports = function (options) {

    options = options || {};
    var throwUncaughtError = !!options.throwUncaughtError || true;

    function makePromise() {
        lift.extend = extend;
        lift.resolve = resolve;
        lift.reject = reject;
        lift.promise = newPromise;
        lift.isPromise = isPromise;
        lift.isWellPromise = isWellPromise;
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
        if (isWellPromise(promiseOrValue) && promiseOrValue.resolved) {
            return newResolvedPromise(promiseOrValue.state, promiseOrValue.value);
        }
        if (isPromise(promiseOrValue)) {
            return newPromise(function (resolve) {
                resolve(promiseOrValue);
            });
        }
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
        if (isWellPromise(promiseOrValue) && promiseOrValue.resolved) {
            return newResolvedPromise(promiseOrValue.state, promiseOrValue.value);
        }
        if (isPromise(promiseOrValue)) {
            return newPromise(function (resolve, reject) {
                reject(promiseOrValue);
            });
        }
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
            defineProperty(PromiseResolved, key, d(api[key]));
            defineProperty(PromiseUnresolved, key, d(api[key]));
        });
        return this;
    }

    var PromiseResolved, PromiseUnresolved, doneFn;

    PromiseResolved = Object.create(Function.prototype, {
        __well__: d('', true),
        resolved: d(true),
        then: d(function then(onFulfilled, onRejected, onProgress) {
            /*jshint unused:false*/
            var value = invoke(this.state, this.value, arguments);
            if (isPromise(value)) return resolve(value);
            return newResolvedPromise(this.state, value);
        }),

        done: d(doneFn = function done(onFulfilled, onRejected, onProgress) {
            /*jshint unused:false*/
            invoke(this.state, this.value, arguments);
        }),

        end: d(doneFn)
    });

    PromiseUnresolved = Object.create(Function.prototype, {
        __well__: d('', true),
        then: d(function (onFulfilled, onRejected, onProgress) {
            var self = this,
                args = arguments;
            return newPromise(function (resolve, reject, notify) {
                deliver(self, args, [resolve, reject, notify]);
            }, this.cancel);
        }),

        done: d(function (onFulfilled, onRejected, onProgress) {
            deliver(this, arguments);
        }),

        end: d(doneFn)
    });

    extend({
        inspect: function () {
            return toInspectState(this.state, this.value);
        }
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
            var hasConsumers = !!promise.__consumers && promise.__consumers.length > 0;
            if (hasConsumers) scheduleConsumers(promise.__consumers, state, value);
            promise.__proto__ = PromiseResolved;
            promise.value = value;
            promise.state = state;

            // Throw uncaught reject value if throwUncaughtError enabled
            if (throwUncaughtError && !hasConsumers && (state === states.rejected) && utils.isError(value)) {
                throw value;
            }
        }
    }

    function deliver(promise, handlers, resolvers) {
        if (!promise.__consumers) promise.__consumers = [];
        return promise.__consumers.push(invokeAll);

        function invokeAll(state, value) {
            // catch callbacks errors
            var result;
            try {
                result = invoke(state, value, handlers);
                if (state === states.rejected) state = states.fulfilled;
            } catch (e) {
                result = e;
                state = states.rejected;
            }
            if (resolvers) {
                if (isPromise(result)) {
                    result.then(resolvers[0], resolvers[1], resolvers[2]);
                } else {
                    invoke(state, result, resolvers);
                }
            }
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

function isWellPromise(promiseOrValue) {
    return promiseOrValue && promiseOrValue.__well__;
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

function toInspectState(s, x) {
    if (s === states.fulfilled) return toFulfilledState(x);
    if (s === states.rejected) return toRejectedState(x);
    return toPendingState();
}

/**
 * Creates a fulfilled state snapshot
 * @private
 * @param {*} x any value
 * @returns {{state:'fulfilled',value:*}}
 */
function toFulfilledState(x) {
    return { state: 'fulfilled', value: x };
}

/**
 * Creates a rejected state snapshot
 * @private
 * @param {*} x any reason
 * @returns {{state:'rejected',reason:*}}
 */
function toRejectedState(x) {
    return { state: 'rejected', reason: x };
}

/**
 * Creates a pending state snapshot
 * @private
 * @returns {{state:'pending'}}
 */
function toPendingState() {
    return { state: 'pending' };
}
