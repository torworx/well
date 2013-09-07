var well = require('../../');

exports.defer = function () {
    var deferred = well.defer();

    return {
        promise: deferred.promise,
        fulfill: deferred.resolve,
        resolve: deferred.resolve,
        reject: deferred.reject
    };
};

exports.fulfilled = well.resolve;
exports.rejected = well.reject;

exports.all = well.all;
exports.map = well.map;
exports.reduce = well.reduce;