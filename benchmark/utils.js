var nextTick;
// Prefer setImmediate, cascade to node, vertx and finally setTimeout
if (typeof setImmediate === 'function') {
    nextTick = setImmediate.bind(global);
} else if(typeof MessageChannel !== 'undefined') {
    var channel = new MessageChannel();
    channel.port1.onmessage = drainQueue;
    nextTick = function() { channel.port2.postMessage(0); };
} else if (typeof process === 'object' && process.nextTick) {
    nextTick = process.nextTick;
} else if (typeof vertx === 'object') {
    nextTick = vertx.runOnLoop;
} else {
    nextTick = function(t) { setTimer(t, 0); };
}

exports.nextTick = nextTick;

exports.noop = function () {
    // no-op
};