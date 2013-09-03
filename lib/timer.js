/*global vertx,setTimeout,clearTimeout*/

var setTimer, cancelTimer;

if(typeof vertx === 'object') {
    setTimer = function (f, ms) { return vertx.setTimer(ms, f); };
    cancelTimer = vertx.cancelTimer;
} else {
    setTimer = setTimeout;
    cancelTimer = clearTimeout;
}

// TODO: freeze
module.exports = exports = {
    set: setTimer,
    cancel: cancelTimer
};