(function (define, global) {
    'use strict';
    define(function () {

        var reduceArray, slice, undef, states;

        //
        // Public API
        //
        well.when = well;   //    Alias for well()
        well.extend = extendPromise;    // Extend promise prototype

        well.promise = promise;

        well.defer = defer;     // Create a deferred
        well.resolve = resolve;   // Create a resolved promise
        well.reject = reject;    // Create a rejected promise

        well.join = join;      // Join 2 or more promises

        well.all = all;       // Resolve a list of promises
        well.map = map;       // Array.map() for promises
        well.reduce = reduce;    // Array.reduce() for promises

        well.any = any;       // One-winner race
        well.some = some;      // Multi-winner race

        well.chain = chain;     // Make a promise trigger another resolver

        well.isPromise = isPromise; // Determine if a thing is a promise

        /**
         * Register an observer for a promise or immediate value.
         *
         * @param {*} promiseOrValue
         * @param {function?} [onFulfilled] callback to be called when promiseOrValue is
         *   successfully fulfilled.  If promiseOrValue is an immediate value, callback
         *   will be invoked immediately.
         * @param {function?} [onRejected] callback to be called when promiseOrValue is
         *   rejected.
         * @param {function?} [onProgress] callback to be called when progress updates
         *   are issued for promiseOrValue.
         * @returns {Promise} a new {@link Promise} that will complete with the return
         *   value of callback or errback or the completion value of promiseOrValue if
         *   callback and/or errback is not supplied.
         */
        function well(promiseOrValue, onFulfilled, onRejected, onProgress) {
            // Get a trusted promise for the input promiseOrValue, and then
            // register promise handlers
            return resolve(promiseOrValue).then(onFulfilled, onRejected, onProgress);
        }

        /**
         * Returns promiseOrValue if promiseOrValue is a {@link Promise}, a new Promise if
         * promiseOrValue is a foreign promise, or a new, already-fulfilled {@link Promise}
         * whose value is promiseOrValue if promiseOrValue is an immediate value.
         *
         * @param {*} promiseOrValue
         * @returns {Promise} Guaranteed to return a trusted Promise.  If promiseOrValue
         *   is trusted, returns promiseOrValue, otherwise, returns a new, already-resolved
         *   well.js promise whose resolution value is:
         *   * the resolution value of promiseOrValue if it's a foreign promise, or
         *   * promiseOrValue if it's a value
         */
        function resolve(promiseOrValue) {
            var promise;

            if (promiseOrValue instanceof Promise) {
                // It's a well.js promise, so we trust it
                promise = promiseOrValue;

            } else if (isPromise(promiseOrValue)) {
                // Assimilate foreign promises
                promise = assimilate(promiseOrValue);
            } else {
                // It's a value, create a fulfilled promise for it.
                promise = fulfilled(promiseOrValue);
            }

            return promise;
        }

        /**
         * Assimilate an untrusted thenable by introducing a trusted middle man.
         * Not a perfect strategy, but possibly the best we can do.
         * IMPORTANT: This is the only place well.js should ever call an untrusted
         * thenable's then() on an. Don't expose the return value to the untrusted thenable
         *
         * @param {*} thenable
         * @param {function} thenable.then
         * @returns {Promise}
         */
        function assimilate(thenable) {
            var d = defer();

            // TODO: Enqueue this for future execution in 2.0
            try {
                thenable.then(
                    function (value) {
                        d.resolve(value);
                    },
                    function (reason) {
                        d.reject(reason);
                    },
                    function (update) {
                        d.notify(update);
                    }
                );
            } catch (e) {
                d.reject(e);
            }

            return d.promise;
        }

        /**
         * Returns a rejected promise for the supplied promiseOrValue.  The returned
         * promise will be rejected with:
         * - promiseOrValue, if it is a value, or
         * - if promiseOrValue is a promise
         *   - promiseOrValue's value after it is fulfilled
         *   - promiseOrValue's reason after it is rejected
         * @param {*} promiseOrValue the rejected value of the returned {@link Promise}
         * @return {Promise} rejected {@link Promise}
         */
        function reject(promiseOrValue) {
            return well(promiseOrValue, rejected);
        }

        states = (function () {
            var fulfilled = 'fulfilled',
                rejected = 'rejected';

            return {
                fulfilled: fulfilled,
                rejected: rejected,
                isResolved: isResolved,
                isFulfilled: isRejected,
                isRejected: isRejected,
                fulfill: fulfill,
                reject: reject,
                resolve: resolve,
                inspect: inspect
            };

            function isResolved(promise) {
                return promise && promise.state;
            }

            function isFulfilled(promise) {
                return promise && promise.state === fulfilled;
            }

            function isRejected(promise) {
                return promise && promise.state === rejected;
            }

            function fulfill(promise, value) {
                promise.state = fulfilled;
                promise.value = value;
            }

            function reject(promise, reason) {
                promise.state = rejected;
                promise.reason = reason;
            }

            function resolve(promise, source) {
                if (isFulfilled(source)) {
                    return fulfill(promise, source.value);
                } else if (isRejected(source)) {
                    return reject(promise, source.reason);
                }
                // fulfill or mark pending ???
                return fulfill(promise, source);
            }

            function inspect(promise) {
                if (isFulfilled(promise)) {
                    return toFulfilledState(promise.value);
                } else if (isRejected(promise)) {
                    return toRejectedState(promise.reason);
                }
                return toPendingState();
            }

            function toFulfilledState(value) {
                return { state: fulfilled, value: value };
            }

            function toRejectedState(reason) {
                return { state: rejected, reason: reason };
            }

            function toPendingState() {
                return { state: 'pending' };
            }

        })();

        /**
         * Trusted Promise constructor.  A Promise created from this constructor is
         * a trusted well.js promise.  Any other duck-typed promise is considered
         * untrusted.
         * @constructor
         * @name Promise
         */
        function Promise() {
        }

        Promise.prototype = {

            then: unimplemented,
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
                    return resolve(onFulfilledOrRejected());
                }
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
             * Assumes that this promise will fulfill with an array, and arranges
             * for the onFulfilled to be called with the array as its argument list
             * i.e. onFulfilled.apply(undefined, array).
             * @param {function} onFulfilled function to receive spread arguments
             * @return {Promise}
             */
            spread: function (onFulfilled) {
                return this.then(function (array) {
                    // array may contain promises, so resolve its contents.
                    return all(array, function (array) {
                        return onFulfilled.apply(undef, array);
                    });
                });
            },

            /**
             *
             * @param {function?} callback classic callback(err, value)
             * @returns {*}
             */
            cb: function (callback) {
                return this.then(function (value) {
                    callback(null, value);
                }, function (err) {
                    callback(err);
                });
            },

            inspect: function () {
                return states.inspect(this);
            }
        };

        function extendPromise(api) {
            if (!api) return;
            var p = Promise.prototype;
            Object.keys(api).forEach(function (key) {
                p[key] = api[key];
            });
        }

        /**
         * Create an already-resolved promise for the supplied value
         * @private
         *
         * @param {*} value
         * @return {Promise} fulfilled promise
         */
        function fulfilled(value) {
            var p = new Promise();
            p.then = then;
            states.fulfill(p, value);
            return p;

            function then(onFulfilled) {
                try {
                    return resolve(typeof onFulfilled == 'function' ? onFulfilled(value) : value);
                } catch (e) {
                    return rejected(e);
                }
            }
        }

        /**
         * Create an already-rejected {@link Promise} with the supplied
         * rejection reason.
         * @private
         *
         * @param {*} reason
         * @return {Promise} rejected promise
         */
        function rejected(reason) {
            var p = new Promise();
            p.then = then;
            states.reject(p, reason);
            return p;

            function then(_, onRejected) {
                try {
                    return resolve(typeof onRejected == 'function' ? onRejected(reason) : rejected(reason));
                } catch (e) {
                    return rejected(e);
                }
            }
        }

        function promise(resolver) {
            var d = defer();
            try {
                resolver(d.resolve, d.reject, d.notify);
            } catch (e) {
                d.reject(e);
            }

            return d.promise;
        }

        /**
         * Creates a new, Deferred with fully isolated resolver and promise parts,
         * either or both of which may be given out safely to consumers.
         * The Deferred itself has the full API: resolve, reject, progress, and
         * then. The resolver has resolve, reject, and progress.  The promise
         * only has then.
         *
         * @param {function?} canceler
         * @return {{
         * promise: Promise,
         * resolve: function:Promise,
         * reject: function:Promise,
         * notify: function:Promise
         * resolver: {
         *	resolve: function:Promise,
         *	reject: function:Promise,
         *	notify: function:Promise
         * }}}
         */
        function defer(canceler) {
            var deferred, promise, handlers, progressHandlers,
                _then, _notify, _resolve;

            /**
             * The promise for the new deferred
             * @type {Promise}
             */
            promise = new Promise();
            promise.then = then;
            promise.hasHandlers = hasHandlers;

            /**
             * The full Deferred object, with {@link Promise} and {@link Resolver} parts
             * @class Deferred
             * @name Deferred
             */
            deferred = {
                resolve: promiseResolve, reject: promiseReject, notify: promiseNotify, promise: promise,
                resolver: { resolve: promiseResolve, reject: promiseReject, notify: promiseNotify }
            };

            if (canceler) {
                deferred.cancel = promise.cancel = function (reason) {
                    return deferred.reject(canceler(reason));
                }
            }

            handlers = [];
            progressHandlers = [];

            function hasHandlers() {
                return handlers && handlers.length > 0;
            }

            /**
             * Pre-resolution then() that adds the supplied callback, errback, and progback
             * functions to the registered listeners
             * @private
             *
             * @param {function?} [onFulfilled] resolution handler
             * @param {function?} [onRejected] rejection handler
             * @param {function?} [onProgress] progress handler
             */
            _then = function (onFulfilled, onRejected, onProgress) {
                var d, progressHandler;

                d = defer();

                progressHandler = typeof onProgress === 'function' ?
                    function (update) {
                        try {
                            // Allow progress handler to transform progress event
                            d.notify(onProgress(update));
                        } catch (e) {
                            // Use caught value as progress
                            d.notify(e);
                        }
                    } :
                    function (update) {
                        d.notify(update);
                    };

                handlers.push(function (promise) {
                    var p = promise.then(onFulfilled, onRejected);
                    // Throw unhandled exception.
                    if (states.isRejected(p) && !d.promise.hasHandlers()) throw p.reason;
                    return p.then(d.resolve, d.reject, progressHandler);
                });

                progressHandlers.push(progressHandler);

                return d.promise;
            };

            /**
             * Issue a progress event, notifying all progress listeners
             * @private
             * @param {*} update progress event payload to pass to all listeners
             */
            _notify = function (update) {
                processQueue(progressHandlers, update);
                return update;
            };

            /**
             * Transition from pre-resolution state to post-resolution state, notifying
             * all listeners of the resolution or rejection
             * @private
             * @param {*} value the value of this deferred
             */
            _resolve = function (value) {
                // Replace _then with one that directly notifies with the result.
                _then = value.then;
                // Replace _resolve so that this Deferred can only be resolved once
                _resolve = resolve;
                // Make _progress a noop, to disallow progress for the resolved promise.
                _notify = identity;

                states.resolve(promise, value);

                // Notify handlers
                processQueue(handlers, value);

                // Free progressHandlers array since we'll never issue progress events
                progressHandlers = handlers = undef;

                return value;
            };

            return deferred;

            /**
             * Wrapper to allow _then to be replaced safely
             * @param {function?} [onFulfilled] resolution handler
             * @param {function?} [onRejected] rejection handler
             * @param {function?} [onProgress] progress handler
             * @return {Promise} new promise
             */
            function then(onFulfilled, onRejected, onProgress) {
                // TODO: Promises/A+ check typeof onFulfilled, onRejected, onProgress
                return _then(onFulfilled, onRejected, onProgress);
            }

            /**
             * Wrapper to allow _resolve to be replaced
             */
            function promiseResolve(val) {
                return _resolve(resolve(val));
            }

            /**
             * Wrapper to allow _reject to be replaced
             */
            function promiseReject(err) {
                return _resolve(rejected(err));
            }

            /**
             * Wrapper to allow _notify to be replaced
             */
            function promiseNotify(update) {
                return _notify(update);
            }
        }

        /**
         * Determines if promiseOrValue is a promise or not.  Uses the feature
         * test from http://wiki.commonjs.org/wiki/Promises/A to determine if
         * promiseOrValue is a promise.
         *
         * @param {*} promiseOrValue anything
         * @returns {boolean} true if promiseOrValue is a {@link Promise}
         */
        function isPromise(promiseOrValue) {
            return promiseOrValue && typeof promiseOrValue.then === 'function';
        }

        /**
         * Initiates a competitive race, returning a promise that will resolve when
         * howMany of the supplied promisesOrValues have resolved, or will reject when
         * it becomes impossible for howMany to resolve, for example, when
         * (promisesOrValues.length - howMany) + 1 input promises reject.
         *
         * @param {Array} promisesOrValues array of anything, may contain a mix
         *      of promises and values
         * @param howMany {number} number of promisesOrValues to resolve
         * @param {function?} [onFulfilled] resolution handler
         * @param {function?} [onRejected] rejection handler
         * @param {function?} [onProgress] progress handler
         * @returns {Promise} promise that will resolve to an array of howMany values that
         * resolved first, or will reject with an array of (promisesOrValues.length - howMany) + 1
         * rejection reasons.
         */
        function some(promisesOrValues, howMany, onFulfilled, onRejected, onProgress) {

            checkCallbacks(2, arguments);

            return well(promisesOrValues, function (promisesOrValues) {

                var toResolve, toReject, values, reasons, deferred, fulfillOne, rejectOne, notify, len, i;

                len = promisesOrValues.length >>> 0;

                toResolve = Math.max(0, Math.min(howMany, len));
                values = [];

                toReject = (len - toResolve) + 1;
                reasons = [];

                deferred = defer();

                // No items in the input, resolve immediately
                if (!toResolve) {
                    deferred.resolve(values);

                } else {
                    notify = deferred.notify;

                    rejectOne = function (reason) {
                        reasons.push(reason);
                        if (!--toReject) {
                            fulfillOne = rejectOne = noop;
                            deferred.reject(reasons);
                        }
                    };

                    fulfillOne = function (val) {
                        // This orders the values based on promise resolution order
                        // Another strategy would be to use the original position of
                        // the corresponding promise.
                        values.push(val);

                        if (!--toResolve) {
                            fulfillOne = rejectOne = noop;
                            deferred.resolve(values);
                        }
                    };

                    for (i = 0; i < len; ++i) {
                        if (i in promisesOrValues) {
                            well(promisesOrValues[i], fulfiller, rejecter, notify);
                        }
                    }
                }

                return deferred.promise.then(onFulfilled, onRejected, onProgress);

                function rejecter(reason) {
                    rejectOne(reason);
                }

                function fulfiller(val) {
                    fulfillOne(val);
                }

            });
        }

        /**
         * Initiates a competitive race, returning a promise that will resolve when
         * any one of the supplied promisesOrValues has resolved or will reject when
         * *all* promisesOrValues have rejected.
         *
         * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
         *      of {@link Promise}s and values
         * @param {function?} [onFulfilled] resolution handler
         * @param {function?} [onRejected] rejection handler
         * @param {function?} [onProgress] progress handler
         * @returns {Promise} promise that will resolve to the value that resolved first, or
         * will reject with an array of all rejected inputs.
         */
        function any(promisesOrValues, onFulfilled, onRejected, onProgress) {

            function unwrapSingleResult(val) {
                return onFulfilled ? onFulfilled(val[0]) : val[0];
            }

            return some(promisesOrValues, 1, unwrapSingleResult, onRejected, onProgress);
        }

        /**
         * Return a promise that will resolve only once all the supplied promisesOrValues
         * have resolved. The resolution value of the returned promise will be an array
         * containing the resolution values of each of the promisesOrValues.
         * @memberOf well
         *
         * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
         *      of {@link Promise}s and values
         * @param {function?} [onFulfilled] resolution handler
         * @param {function?} [onRejected] rejection handler
         * @param {function?} [onProgress] progress handler
         * @returns {Promise}
         */
        function all(promisesOrValues, onFulfilled, onRejected, onProgress) {
            checkCallbacks(1, arguments);
            return map(promisesOrValues, identity).then(onFulfilled, onRejected, onProgress);
        }

        /**
         * Joins multiple promises into a single returned promise.
         * @return {Promise} a promise that will fulfill when *all* the input promises
         * have fulfilled, or will reject when *any one* of the input promises rejects.
         */
        function join(/* ...promises */) {
            return map(arguments, identity);
        }

        /**
         * Traditional map function, similar to `Array.prototype.map()`, but allows
         * input to contain {@link Promise}s and/or values, and mapFunc may return
         * either a value or a {@link Promise}
         *
         * @param {Array|Promise} promise array of anything, may contain a mix
         *      of {@link Promise}s and values
         * @param {function} mapFunc mapping function mapFunc(value) which may return
         *      either a {@link Promise} or value
         * @returns {Promise} a {@link Promise} that will resolve to an array containing
         *      the mapped output values.
         */
        function map(promise, mapFunc) {
            return well(promise, function (array) {
                var results, len, toResolve, resolve, i, d;

                // Since we know the resulting length, we can preallocate the results
                // array to avoid array expansions.
                toResolve = len = array.length >>> 0;
                results = [];
                d = defer();

                if (!toResolve) {
                    d.resolve(results);
                } else {

                    resolve = function resolveOne(item, i) {
                        well(item, mapFunc).then(function (mapped) {
                            results[i] = mapped;

                            if (!--toResolve) {
                                d.resolve(results);
                            }
                        }, d.reject);
                    };

                    // Since mapFunc may be async, get all invocations of it into flight
                    for (i = 0; i < len; i++) {
                        if (i in array) {
                            resolve(array[i], i);
                        } else {
                            --toResolve;
                        }
                    }

                }

                return d.promise;

            });
        }

        /**
         * Traditional reduce function, similar to `Array.prototype.reduce()`, but
         * input may contain promises and/or values, and reduceFunc
         * may return either a value or a promise, *and* initialValue may
         * be a promise for the starting value.
         *
         * @param {Array|Promise} promise array or promise for an array of anything,
         *      may contain a mix of promises and values.
         * @param {function} reduceFunc reduce function reduce(currentValue, nextValue, index, total),
         *      where total is the total number of items being reduced, and will be the same
         *      in each call to reduceFunc.
         * @returns {Promise} that will resolve to the final reduced value
         */
        function reduce(promise, reduceFunc /*, initialValue */) {
            var args = slice.call(arguments, 1);

            return well(promise, function (array) {
                var total;

                total = array.length;

                // Wrap the supplied reduceFunc with one that handles promises and then
                // delegates to the supplied.
                args[0] = function (current, val, i) {
                    return well(current, function (c) {
                        return well(val, function (value) {
                            return reduceFunc(c, value, i, total);
                        });
                    });
                };

                return reduceArray.apply(array, args);
            });
        }

        /**
         * Ensure that resolution of promiseOrValue will trigger resolver with the
         * value or reason of promiseOrValue, or instead with resolveValue if it is provided.
         *
         * @param promiseOrValue
         * @param {Object} resolver
         * @param {function} resolver.resolve
         * @param {function} resolver.reject
         * @param {*} [resolveValue]
         * @returns {Promise}
         */
        function chain(promiseOrValue, resolver, resolveValue) {
            var useResolveValue = arguments.length > 2;

            return well(promiseOrValue,
                function (val) {
                    val = useResolveValue ? resolveValue : val;
                    resolver.resolve(val);
                    return val;
                },
                function (reason) {
                    resolver.reject(reason);
                    return rejected(reason);
                },
                function (update) {
                    typeof resolver.notify === 'function' && resolver.notify(update);
                    return update;
                }
            );
        }

        //
        // Utility functions
        //

        /**
         * Apply all functions in queue to value
         * @param {Array} queue array of functions to execute
         * @param {*} value argument passed to each function
         */
        function processQueue(queue, value) {
            var handler, i = 0;

            while (handler = queue[i++]) {
                handler(value);
            }
        }

        /**
         * Helper that checks arrayOfCallbacks to ensure that each element is either
         * a function, or null or undefined.
         * @private
         * @param {number} start index at which to start checking items in arrayOfCallbacks
         * @param {Array} arrayOfCallbacks array to check
         * @throws {Error} if any element of arrayOfCallbacks is something other than
         * a functions, null, or undefined.
         */
        function checkCallbacks(start, arrayOfCallbacks) {
            // TODO: Promises/A+ update type checking and docs
            var arg, i = arrayOfCallbacks.length;

            while (i > start) {
                arg = arrayOfCallbacks[--i];

                if (arg != null && typeof arg != 'function') {
                    throw new Error('arg ' + i + ' must be a function');
                }
            }
        }

        /**
         * No-Op function used in method replacement
         * @private
         */
        function noop() {
        }

        slice = [].slice;

        // ES5 reduce implementation if native not available
        // See: http://es5.github.com/#x15.4.4.21 as there are many
        // specifics and edge cases.
        reduceArray = [].reduce ||
            function (reduceFunc /*, initialValue */) {
                /*jshint maxcomplexity: 7*/

                // ES5 dictates that reduce.length === 1

                // This implementation deviates from ES5 spec in the following ways:
                // 1. It does not check if reduceFunc is a Callable

                var arr, args, reduced, len, i;

                i = 0;
                // This generates a jshint warning, despite being valid
                // "Missing 'new' prefix when invoking a constructor."
                // See https://github.com/jshint/jshint/issues/392
                arr = Object(this);
                len = arr.length >>> 0;
                args = arguments;

                // If no initialValue, use first item of array (we know length !== 0 here)
                // and adjust i to start at second item
                if (args.length <= 1) {
                    // Skip to the first real element in the array
                    for (; ;) {
                        if (i in arr) {
                            reduced = arr[i++];
                            break;
                        }

                        // If we reached the end of the array without finding any real
                        // elements, it's a TypeError
                        if (++i >= len) {
                            throw new TypeError();
                        }
                    }
                } else {
                    // If initialValue provided, use it
                    reduced = args[1];
                }

                // Do the actual reduce
                for (; i < len; ++i) {
                    // Skip holes
                    if (i in arr) {
                        reduced = reduceFunc(reduced, arr[i], i, arr);
                    }
                }

                return reduced;
            };

        function identity(x) {
            return x;
        }

        function unimplemented() {
            throw new Error('Unimplemented');
        }


        return well;
    });
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(); }, this);