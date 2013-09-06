var q = require('q');

exports.defer = function () {
    var deferred = q.defer();

    return {
        promise: deferred.promise,
        fulfill: deferred.resolve,
        resolve: deferred.resolve,
        reject: deferred.reject
    };
};

exports.fulfilled = q.resolve;
exports.rejected = q.reject;

exports.all = q.all;