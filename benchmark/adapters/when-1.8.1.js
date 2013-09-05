var when = require('../custom_modules/when1.8.1');

exports.defer = function () {
    var deferred = when.defer();

    return {
        promise: deferred.promise,
        fulfill: deferred.resolve,
        reject: deferred.reject
    };
};

exports.fulfilled = when.resolve;
exports.rejected = when.reject;

exports.map = when.map;
exports.reduce = when.reduce;