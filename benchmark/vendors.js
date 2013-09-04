var vendors = [];
vendors.push('well');
vendors.push('deferred');
vendors.push('when');
vendors.push('q');


module.exports = exports = vendors.reduce(function (result, name) {
    result[name] = require('./adapters/' + name);
    return result;
}, {});