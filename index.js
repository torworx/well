var well = require('./lib/well');
var utils = require('./lib/utils');

module.exports = well;

utils.merge(well, require('./lib/well-array'));