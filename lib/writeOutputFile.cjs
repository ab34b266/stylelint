'use strict';

const node_path = require('node:path');
const promises = require('node:fs/promises');
const stripAnsi = require('strip-ansi');
const writeFileAtomic = require('write-file-atomic');

/**
 * @param {string} content
 * @param {string} filePath
 * @returns {Promise<void>}
 */
async function writeOutputFile(content, filePath) {
	await promises.mkdir(node_path.dirname(filePath), { recursive: true });

	await writeFileAtomic(node_path.normalize(filePath), stripAnsi(content));
}

module.exports = writeOutputFile;
