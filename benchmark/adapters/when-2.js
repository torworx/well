var when = require('when');

exports.defer = function () {
    var deferred = when.defer();

    return {
        promise: deferred.promise,
        fulfill: deferred.resolve,
        resolve: deferred.resolve,
        reject: deferred.reject
    };
};

exports.fulfilled = when.resolve;
exports.rejected = when.reject;

exports.all = when.all;
exports.map = when.map;
exports.reduce = when.reduce;