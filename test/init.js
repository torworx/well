var t = require('chai').assert;
require('chai').Assertion.includeStack = true;

t.plan = function (n, done) {
    var i = 0;

    return {
        check: function () {
            if (++i >= n) done();
        }
    }

};
