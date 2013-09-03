
module.exports = well;

well.promise = promise;
well.resolve = resolve;
well.reject = reject;
well.defer = defer;

well.isPromise = isPromise;

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


/**
 * Trusted Promise constructor.  A Promise created from this constructor is
 * a trusted well.js promise.  Any other duck-typed promise is considered
 * untrusted.
 * @constructor
 * @name Promise
 */
function Promise() {}

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
    return promise(function (resolve) {
        resolve(promiseOrValue);
    });
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
    return promise(function (resolve, reject) {
        reject(promiseOrValue);
    });
}


function defer(canceler) {
    var deferred, pending, resolved, cancel;

    deferred = {
        promise: undef, resolve: undef, reject: undef, notify: undef,
        resolver: { resolve: undef, reject: undef, notify: undef }
    };

    if (canceler) {
        cancel = function (reason) {
            deferred.reject(canceler(reason));
        };
        deferred.cancel = cancel;
    }

    deferred.promise = pending = makePromise(makeDeferred, cancel);

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

function promise(resolver) {
    return makePromise(resolver);
}

function makePromise(resolver, cancel) {
    var promise, consumers;

    promise = new Promise();
    promise.then = then;
    promise.done = promise.end = done;
    if (cancel) promise.cancel = cancel;

    if (resolver) resolver(promiseResolve, promiseReject, promiseNotify);

    return promise;

    function schedule(handlers, resolvers) {
        if (promise.resolved) return invoke(promise.failed ? 1 : 0, promise.value);

        if (!consumers) consumers = [];
        return consumers.push(invoke);

        function invoke(h, v) {
            var fn, r = v;
            // Invoke handlers
            if (fn = handlers[h]) {
                r = fn(v);
            }
            // Invoke sub promise resolvers
            if (resolvers && (fn = resolvers[h])) {
                fn(r);
            }
            return r;
        }
    }

    /**
     * Register handlers for this promise and return new promise.
     * @param [onFulfilled] {Function} fulfillment handler
     * @param [onRejected] {Function} rejection handler
     * @param [onProgress] {Function} progress handler
     * @return {Promise} new Promise
     */
    function then(onFulfilled, onRejected, onProgress) {
        /*jshint unused:false*/
        if (promise.resolved) {
            var value = promise.failed ? onRejected && onRejected(promise.value) : onFulfilled && onFulfilled(promise.value);
            var result = makePromise();
            result.resolved = true;
            result.value = value;
            result.failed = promise.failed;
            return result;
        }
        var args = arguments;
        return makePromise(function (resolve, reject, notify) {
            schedule(args, [resolve, reject, notify]);
        }, cancel);
    }

    /**
     * Register handlers for this promise without return promise.
     * @param [onFulfilled] {Function} fulfillment handler
     * @param [onRejected] {Function} rejection handler
     * @param [onProgress] {Function} progress handler
     */
    function done(onFulfilled, onRejected, onProgress) {
        /*jshint unused:false*/
        schedule(arguments);
    }

    function promiseResolve(value) {
        resolveOrReject(value);
    }

    function promiseReject(reason) {
        resolveOrReject(reason, true);
    }

    function promiseNotify(update) {
        if (consumers) {
            scheduleConsumers(consumers, 2, update);
        }
    }

    function resolveOrReject(val, failed) {
        if (promise.resolved) return;

        if (isPromise(val)) {
            val.then(promiseResolve, promiseReject);
            return;
        }
        promise.resolved = true;
        promise.value = val;
        promise.failed = failed;
        if (consumers) scheduleConsumers(consumers, failed ? 1 : 0, val);
        consumers = undef;
    }
}

/**
 * Schedule a task that well process a list of handlers
 * in the next queue drain run.
 * @private
 * @param {Array} handlers queue of handlers to execute
 * @param {Number} method
 * @param {*} value
 */
function scheduleConsumers(handlers, method, value) {
    var handler, i = 0;
    while (handler = handlers[i++]) {
        handler(method, value);
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

// Internals, utilities, etc.

var nextTick, undef;


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