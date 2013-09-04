module.exports = Benchmark;

function Benchmark(name) {
    if (!(this instanceof Benchmark)) {
        return new Benchmark(name);
    }
    EventEmitter.call(this);
    this.name = name;
    this.tests = [];
}

Benchmark.prototype.add = function (name, fn) {
    var test = new Test(name, fn);
    test.on('complete', this.emit.bind(this, 'cycle'));
    this.tests.push(test);
    return this;
};

Benchmark.prototype.run = function (count) {
    var self = this;
    var tests = this.tests, test, index = 0;
    this.emit('start');
    (function next() {
        if (index >= tests.length) return complete();
        test = tests[index++];
        if (!test) return next();
        return test.run(count, next);
    })();

    function complete() {
        self.emit('complete', self);
    }
    return this;
};

function Test(name, fn) {
    var test = this;

    // Test instances get EventEmitter API
    EventEmitter.call(test);

    if (!fn) throw new Error('Undefined test function');
    if (typeof fn !== 'function') {
        throw new Error('"' + name + '" test: Invalid test function');
    }

    /**
     * Reset test state
     */
    function reset() {
        delete test.count;
        delete test.time;
        delete test.running;
        test.emit('reset', test);
        return test;
    }

    function clone() {
        var test = extend(new Test(name, fn), test);
        return test.reset();
    }

    /**
     * Run the test n times, and use the best results
     */
    function bestOf(n, done) {
        var best = null;
        (function next() {
            if (n--) {
                var t = clone();
                t.run(null, function () {
                    if (!best || t.period < best.period) {
                        best = t;
                    }
                    next();
                });
            } else {
                extend(test, best);
                done(test);
            }
        })();
    }

    function run(count, done) {
        count = count || test.INIT_COUNT;

        _run(count, done);
        return test;
    }

    /**
     * Run, for real
     */
    function _run(count, done) {

        try {
            var start, fn = test.fn, i = count, async = (fn.length > 0);

            // Run the test code
            test.count = count;
            test.time = 0;
            test.period = 0;

            test.emit('start', test);

            // Start the timer
            start = Date.now();
            if (async) {
                fn(count, complete);
            } else {
                while (i--) fn();
                complete();
            }

            function complete() {
                _complete();
            }

            function _complete(time) {
                // Get time test took (in secs)
                test.time = time || (Date.now() - start);

                // Store iteration count and per-operation time taken
                test.count = count;
                test.period = test.time / count;
                test.hz = sig(1 / test.period, 4);

                test.emit('complete', test);
                done();
            }
        } catch (err) {
            // Exceptions are caught and displayed in the test UI
            test.emit('error', err);
            _complete(1e9);
        }

        return test;
    }

    // Set properties that are specific to this instance
    extend(test, {
        // Test name
        name: name,
        // Test function
        fn: fn,

        clone: clone,
        run: run,
        bestOf: bestOf,
        reset: reset
    });

    // IE7 doesn't do 'toString' or 'toValue' in object enumerations, so set
    // it explicitely here.
    test.toString = function () {
        var self = this;
        if (self.time) {
            return self.name + ', f = ' +
                humanize(self.hz) + 'hz (' +
                humanize(self.count) + '/' + humanize(self.time) + 'ms)';
        } else {
            return self.name + ', count = ' + humanize(self.count);
        }
    };
}

// Set default property values
extend(Test.prototype, {
    // Initial number of iterations
    INIT_COUNT: 10,

    // Max iterations allowed (used to detect bad looping functions)
    MAX_COUNT: 1e9,

    // Minimum time test should take to get valid results (secs)
    MIN_TIME: 1.0
});

function Deferred() {
    if (!(this instanceof Deferred)) return new Deferred();
    var self = this;
    this.callback = function (cb) {
        this.cb = cb;
    }
    this.resolve = function (value) {
        if (self.cb) self.cb(value);
    };
    this.reject = function (reason) {
        if (self.cb) self.cb(null, reason);
    };
}


// Copy properties
function extend(dst, src) {
    for (var k in src) if (src.hasOwnProperty(k)) {
        dst[k] = src[k];
    }
    return dst;
}

// Node.js-inspired event emitter API, with some enhancements.
function EventEmitter() {
    var ee = this;
    var listeners = {};

    this.on = function (e, fn) {
        if (!listeners[e]) listeners[e] = [];
        listeners[e].push(fn);
        return this;
    };
    this.removeListener = function (e, fn) {
        listeners[e] = filter(listeners[e], function (l) {
            return l != fn;
        });
    };
    this.removeAllListeners = function (e) {
        listeners[e] = [];
    };
    this.emit = function (e) {
        var args = Array.prototype.slice.call(arguments, 1);
        [].concat(listeners[e], listeners['*']).forEach(function (l) {
            ee._emitting = e;
            if (l) l.apply(ee, args);
        });
        delete ee._emitting;
        return this;
    };
}

// Round x to d significant digits
function sig(x, d) {
    var exp = Math.ceil(Math.log(Math.abs(x)) / Math.log(10)),
        f = Math.pow(10, exp - d);
    return Math.round(x / f) * f;
}

// Convert x to a readable string version
function humanize(x, sd) {
    var ax = Math.abs(x), res;
    sd = sd | 4; // significant digits
    if (ax == Infinity) {
        res = ax > 0 ? 'Infinity' : '-Infinity';
    } else if (ax > 1e9) {
        res = sig(x / 1e9, sd) + 'G';
    } else if (ax > 1e6) {
        res = sig(x / 1e6, sd) + 'M';
    } else if (ax > 1e3) {
        res = sig(x / 1e3, sd) + 'k';
    } else if (ax > .01) {
        res = sig(x, sd);
    } else if (ax > 1e-3) {
        res = sig(x / 1e-3, sd) + 'm';
    } else if (ax > 1e-6) {
        res = sig(x / 1e-6, sd) + '\u00b5'; // Greek mu
    } else if (ax > 1e-9) {
        res = sig(x / 1e-9, sd) + 'n';
    } else {
        res = x ? sig(x, sd) : 0;
    }
    // Turn values like "1.1000000000005" -> "1.1"
    res = (res + '').replace(/0{5,}\d*/, '');

    return res;
}