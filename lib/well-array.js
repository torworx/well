var well = require('./well');

exports.all = all;
function all(promisesOrValues, onFulfilled, onRejected, onProgress) {
    return map(promisesOrValues, identity).then(onFulfilled, onRejected, onProgress);
}

/**
 * Internal map that allows a fallback to handle rejections
 * @param {Array|Promise} array array of anything, may contain promises and values
 * @param {function} mapFunc map function which may return a promise or value
 * @param {function?} fallback function to handle rejected promises
 * @returns {*} promise that will fulfill with an array of mapped values
 *  or reject if any input promise rejects.
 */
exports.map = map;
function map(promise, mapFunc, fallback) {
    return well(promise, function(array) {
        var results, len, toResolve, resolve, i, d;

        // Since we know the resulting length, we can preallocate the results
        // array to avoid array expansions.
        toResolve = len = array.length >>> 0;
        results = [];
        d = well.defer();

        if(!toResolve) {
            d.resolve(results);
        } else {

            resolve = function resolveOne(item, i) {
                well(item, mapFunc, fallback).then(function(mapped) {
                    results[i] = mapped;

                    if(!--toResolve) {
                        d.resolve(results);
                    }
                }, d.reject);
            };

            // Since mapFunc may be async, get all invocations of it into flight
            for(i = 0; i < len; i++) {
                if(i in array) {
                    resolve(array[i], i);
                } else {
                    --toResolve;
                }
            }

        }

        return d.promise;

    });
}
//
//function map(array, mapFunc, fallback) {
//    return well(array, function(array) {
//
//        return well.promise(resolveMap);
//
//        function resolveMap(resolve, reject, notify) {
//            var results, len, toResolve, i;
//
//            // Since we know the resulting length, we can preallocate the results
//            // array to avoid array expansions.
//            toResolve = len = array.length >>> 0;
//            results = [];
//
//            if(!toResolve) {
//                resolve(results);
//                return;
//            }
//
//            // Since mapFunc may be async, get all invocations of it into flight
//            for(i = 0; i < len; i++) {
//                if(i in array) {
//                    resolveOne(array[i], i);
//                } else {
//                    --toResolve;
//                }
//            }
//
//            function resolveOne(item, i) {
//                well(item, mapFunc, fallback).then(function(mapped) {
//                    results[i] = mapped;
//                    notify(mapped);
//
//                    if(!--toResolve) {
//                        resolve(results);
//                    }
//                }, reject);
//            }
//        }
//    });
//}

function identity(value) {
    return value;
}