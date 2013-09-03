var utils = require('./utils');
var d = utils.d;


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
    if (isPromise(promiseOrValue)) return makeUnresolvedPromise(function (resolve) {
        resolve(promiseOrValue);
    });
    return makeFulfilledPromise(promiseOrValue);
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
    if (isPromise(promiseOrValue))return makeUnresolvedPromise(function (resolve, reject) {
        reject(promiseOrValue);
    });
    return makeRejectedPromise(promiseOrValue);
}

function makeUnresolvedPromise(resolver, cancel) {
    var promise = function () {};
    promise.__proto__ = PromiseUnresolved;
    if (cancel) promise.cancel = cancel;
    if (resolver) resolver(promiseResolve(promise), promiseReject(promise), promiseNotify(promise));
    return promise;
}

function makeResolvedPromise(state, value) {
    var promise = function () {};
    promise.__proto__ = PromiseResolved;
    promise.state = state;
    promise.value = value;
    return promise;
}

function makeFulfilledPromise(value) {
    return makeResolvedPromise(states.fulfilled, value);
}

function makeRejectedPromise(value) {
    return makeResolvedPromise(states.rejected, value);
}

var PromiseResolved, PromiseUnresolved;

PromiseResolved = Object.create(Function.prototype, {
    resolved: d(true),
    then: d(function then(onFulfilled, onRejected, onProgress) {
        /*jshint unused:false*/
        var value = invoke(this.state, this.value, arguments);
        if (isPromise(value)) return resolve(value);
        return makeResolvedPromise(this.state, value);
    }),

    done: d(function done(onFulfilled, onRejected, onProgress) {
        /*jshint unused:false*/
        invoke(this.state, this.value, arguments);
    })
});

PromiseUnresolved = Object.create(Function.prototype, {

    then: d(function (onFulfilled, onRejected, onProgress) {
        var args = arguments;
        return makeUnresolvedPromise(function (resolve, reject, notify) {
            schedule(args, [resolve, reject, notify]);
        }, this.cancel);
    }),

    done: d(function (onFulfilled, onRejected, onProgress) {
        schedule(arguments);
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
        var consumers = promise.__consumers;
        promise.__proto__ = PromiseResolved;
        promise.value = value;
        promise.state = state;
        scheduleConsumers(consumers, promise);
    }
}

function schedule(promise, handlers, resolvers) {
    if (promise.resolved) return invokeAll(promise);

    if (!promise.__consumers) promise.__consumers = [];
    return promise.__consumers.push(invokeAll);

    function invokeAll(promise) {
        var v = invoke(promise.state, promise.value, handlers);
        // TODO process pending if extension has been implemented
        if (resolvers) isPromise(v) ? v.then(resolvers[0], resolvers[1], resolvers[2]) : invoke(promise.state, v, resolvers);
    }
}

function invoke(state, value, handlers) {
    var fn;
    return (handlers && (fn = handlers[toIndex(state)])) ? fn(value) : value;
}


/**
 * Schedule a task that well process a list of handlers
 * in the next queue drain run.
 * @private
 * @param {Array} handlers queue of handlers to execute
 * @param {Function} promise
 */
function scheduleConsumers(handlers, promise) {
    if (!handlers) return;
    var handler, i = 0;
    while (handler = handlers[i++]) {
        handler(promise);
    }
}

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

function toIndex(state) {
    if (state === states.fulfilled) return 0;
    if (state === states.rejected) return 1;
    return 2;
}

// Internals, utilities, etc.

var nextTick;

// Prefer setImmediate or MessageChannel, cascade to node,
// vertx and finally setTimeout
/*global setImmediate,MessageChannel,process,vertx*/
if (typeof setImmediate === 'function') {
    nextTick = setImmediate.bind(global);
} else if (typeof MessageChannel !== 'undefined') {
    var channel = new MessageChannel();
    channel.port1.onmessage = drainQueue;
    nextTick = function () {
        channel.port2.postMessage(0);
    };
} else if (typeof process === 'object' && process.nextTick) {
    nextTick = process.nextTick;
} else if (typeof vertx === 'object') {
    nextTick = vertx.runOnLoop;
} else {
    nextTick = function (t) {
        setTimeout(t, 0);
    };
}

// expose functions

exports.resolve = resolve;
exports.reject = reject;
exports.promise = makeUnresolvedPromise;
exports.makePromise = makeUnresolvedPromise;
exports.makeUnresolvedPromise = makeUnresolvedPromise;
exports.makeResolvedPromise = makeResolvedPromise;
exports.makeFulfilledPromise = makeFulfilledPromise;
exports.makeRejectedPromise = makeRejectedPromise;
exports.isPromise = isPromise;