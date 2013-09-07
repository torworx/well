(function() {
	'use strict';

	if(typeof exports === 'object') {

		var well = require('../well');

		exports.fulfilled = well.resolve;
		exports.rejected = well.reject;

		exports.pending = function () {
			var pending = {};

			pending.promise = well.promise(function(resolve, reject) {
				pending.fulfill = resolve;
				pending.reject = reject;
			});

			return pending;
		};
	}
})();
