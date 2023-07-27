'use strict';

/**
 * Check whether a hex color is standard
 *
 * @param {string} hex
 * @returns {boolean}
 */
function isStandardSyntaxHexColor(hex) {
	// Less map usage (e.g. .myclass { color: #colors[somecolor]; })
	if (hex.includes('[')) {
		return false;
	}

	return true;
}

module.exports = isStandardSyntaxHexColor;
