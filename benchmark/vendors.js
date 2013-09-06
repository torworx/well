var vendors = [];
vendors.push('when-1.8.1');
vendors.push('well');
vendors.push('when');
vendors.push('deferred');
vendors.push('q');


module.exports = exports = vendors.reduce(function (result, name) {
    result[name] = require('./adapters/' + name);
    return result;
}, {});