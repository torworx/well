var well = require('../../');

exports.defer = function () {
    var deferred = well.defer();

    return {
        promise: deferred.promise,
        fulfill: deferred.resolve,
        reject: deferred.reject
    };
};

exports.fulfilled = well.resolve;
exports.rejected = well.reject;
