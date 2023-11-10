// NOTICE: This file is generated by Rollup. To modify it,
// please instead edit the ESM counterpart and rebuild with Rollup (npm run build).
'use strict';

const postcss = require('postcss');
const validateTypes = require('../../utils/validateTypes.cjs');
const keywords = require('../../reference/keywords.cjs');
const declarationValueIndex = require('../../utils/declarationValueIndex.cjs');
const findFontFamily = require('../../utils/findFontFamily.cjs');
const typeGuards = require('../../utils/typeGuards.cjs');
const isStandardSyntaxValue = require('../../utils/isStandardSyntaxValue.cjs');
const isVariable = require('../../utils/isVariable.cjs');
const optionsMatches = require('../../utils/optionsMatches.cjs');
const report = require('../../utils/report.cjs');
const ruleMessages = require('../../utils/ruleMessages.cjs');
const validateOptions = require('../../utils/validateOptions.cjs');

const ruleName = 'font-family-no-missing-generic-family-keyword';

const messages = ruleMessages(ruleName, {
	rejected: 'Unexpected missing generic font family',
});

const meta = {
	url: 'https://stylelint.io/user-guide/rules/font-family-no-missing-generic-family-keyword',
};

/**
 * @param {import('postcss-value-parser').Node} node
 * @returns {boolean}
 */
const isFamilyNameKeyword = (node) =>
	!('quote' in node) && keywords.fontFamilyKeywords.has(node.value.toLowerCase());

/**
 * @param {string} value
 * @returns {boolean}
 */
const isLastFontFamilyVariable = (value) => {
	const lastValue = postcss.list.comma(value).pop();

	return lastValue != null && (isVariable(lastValue) || !isStandardSyntaxValue(lastValue));
};

/** @type {import('stylelint').Rule} */
const rule = (primary, secondaryOptions) => {
	return (root, result) => {
		const validOptions = validateOptions(
			result,
			ruleName,
			{ actual: primary },
			{
				actual: secondaryOptions,
				possible: {
					ignoreFontFamilies: [validateTypes.isString, validateTypes.isRegExp],
				},
				optional: true,
			},
		);

		if (!validOptions) {
			return;
		}

		root.walkDecls(/^font(-family)?$/i, (decl) => {
			// Ignore @font-face
			const parent = decl.parent;

			if (parent && typeGuards.isAtRule(parent) && parent.name.toLowerCase() === 'font-face') {
				return;
			}

			if (decl.prop === 'font' && keywords.systemFontKeywords.has(decl.value.toLowerCase())) {
				return;
			}

			if (isLastFontFamilyVariable(decl.value)) {
				return;
			}

			const fontFamilies = findFontFamily(decl.value);

			if (fontFamilies.length === 0) {
				return;
			}

			if (fontFamilies.some((node) => isFamilyNameKeyword(node))) {
				return;
			}

			if (
				fontFamilies.some((node) =>
					optionsMatches(secondaryOptions, 'ignoreFontFamilies', node.value),
				)
			) {
				return;
			}

			const lastFontFamily = fontFamilies[fontFamilies.length - 1];

			validateTypes.assert(lastFontFamily);

			const valueIndex = declarationValueIndex(decl);
			const index = valueIndex + lastFontFamily.sourceIndex;
			const endIndex = valueIndex + lastFontFamily.sourceEndIndex;

			report({
				result,
				ruleName,
				message: messages.rejected,
				node: decl,
				index,
				endIndex,
			});
		});
	};
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

module.exports = rule;