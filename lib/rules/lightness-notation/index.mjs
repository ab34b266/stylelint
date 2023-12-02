import valueParser from 'postcss-value-parser';

import declarationValueIndex from '../../utils/declarationValueIndex.mjs';
import dimensionUnitIsEmpty from '../../utils/dimensionUnitIsEmpty.mjs';
import getDeclarationValue from '../../utils/getDeclarationValue.mjs';
import isStandardSyntaxValue from '../../utils/isStandardSyntaxValue.mjs';
import report from '../../utils/report.mjs';
import ruleMessages from '../../utils/ruleMessages.mjs';
import setDeclarationValue from '../../utils/setDeclarationValue.mjs';
import validateOptions from '../../utils/validateOptions.mjs';

const ruleName = 'lightness-notation';

const messages = ruleMessages(ruleName, {
	expected: (unfixed, fixed) => `Expected "${unfixed}" to be "${fixed}"`,
});

const meta = {
	url: 'https://stylelint.io/user-guide/rules/lightness-notation',
	fixable: true,
};

const LIGHTNESS_FUNCS = new Set(['lch', 'lab', 'oklch', 'oklab']);
const HAS_LIGHTNESS_COLOR_FUNC = new RegExp(`\\b(?:${[...LIGHTNESS_FUNCS].join('|')})\\(`, 'i');

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: ['percentage', 'number'],
		});

		if (!validOptions) return;

		root.walkDecls((decl) => {
			if (!HAS_LIGHTNESS_COLOR_FUNC.test(decl.value)) return;

			let needsFix = false;
			const parsedValue = valueParser(getDeclarationValue(decl));

			parsedValue.walk((node) => {
				if (node.type !== 'function') return;

				if (!LIGHTNESS_FUNCS.has(node.value.toLowerCase())) return;

				const lightness = findLightness(node);

				if (!lightness) return;

				const { value } = lightness;

				if (!isStandardSyntaxValue(value)) return;

				if (!isPercentage(value) && !isNumber(value)) return;

				if (primary === 'percentage' && isPercentage(value)) return;

				if (primary === 'number' && isNumber(value)) return;

				const fixed = primary === 'percentage' ? asPercentage(value) : asNumber(value);
				const unfixed = value;

				if (context.fix) {
					lightness.value = fixed;
					needsFix = true;

					return;
				}

				const valueIndex = declarationValueIndex(decl);

				report({
					message: messages.expected,
					messageArgs: [unfixed, fixed],
					node: decl,
					index: valueIndex + lightness.sourceIndex,
					endIndex: valueIndex + lightness.sourceEndIndex,
					result,
					ruleName,
				});
			});

			if (needsFix) {
				setDeclarationValue(decl, parsedValue.toString());
			}
		});
	};
};

/**
 * @param {string} value
 */
function asPercentage(value) {
	const num = parseFloat(value) * 100;

	if (Number.isInteger(num)) return `${num}%`;

	return `${roundToNumberOfDigits(num, value)}%`;
}

/**
 * @param {string} value
 */
function asNumber(value) {
	const dimension = valueParser.unit(value);

	if (dimension) {
		const num = parseFloat(value) / 100;

		return `${roundToNumberOfDigits(num, value)}`;
	}

	throw new TypeError(`The "${value}" value must have a unit`);
}

/**
 * @param {number} num
 * @param {string} value
 */
function roundToNumberOfDigits(num, value) {
	return num.toPrecision(value.length - 2);
}

/**
 * @param {import('postcss-value-parser').FunctionNode} node
 */
function findLightness(node) {
	const args = node.nodes.filter(({ type }) => type === 'word' || type === 'function');
	const value = node.value.toLowerCase();

	if (LIGHTNESS_FUNCS.has(value)) {
		return args[0];
	}

	return undefined;
}

/**
 * @param {string} value
 */
function isPercentage(value) {
	const dimension = valueParser.unit(value);

	return dimension && dimension.unit === '%';
}

/**
 * @param {string} value
 */
function isNumber(value) {
	return dimensionUnitIsEmpty(value);
}

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;
export default rule;
