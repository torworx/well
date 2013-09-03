var promises = require('./lib/promises');

module.exports = well;

var promise, resolve, reject, isPromise;

well.promise = promise = promises.promise;
well.resolve = resolve = promises.resolve;
well.reject = reject = promises.reject;
well.defer = defer;

well.isPromise = isPromise = promises.isPromise;

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
            deferred.reject(canceler(reason));
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

// Internals, utilities, etc.
var undef;