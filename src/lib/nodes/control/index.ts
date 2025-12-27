import type { NodeDefinition } from '../../dataflow/types';

/**
 * If node - conditional branching
 * Supports both single values and arrays:
 * - Single condition: outputs either true or false value
 * - Array condition: filters input arrays based on boolean array
 */
export const IfNode: NodeDefinition = {
	type: 'If',
	category: 'control',
	description: 'Conditional execution based on a condition. Arrays of booleans filter input arrays.',
	inputs: [
		{ name: 'condition', type: 'boolean' },
		{ name: 'true', type: 'any' },
		{ name: 'false', type: 'any' }
	],
	outputs: [
		{ name: 'out', type: 'any' },
		{ name: 'trueOut', type: 'any' },
		{ name: 'falseOut', type: 'any' }
	],
	execute(context) {
		const condition = context.getInputValue('condition');
		const trueValue = context.getInputValue('true');
		const falseValue = context.getInputValue('false');

		// If condition is an array of booleans, filter the input arrays
		if (Array.isArray(condition)) {
			const trueResults: any[] = [];
			const falseResults: any[] = [];

			// Ensure input values are arrays for filtering
			const trueArray = Array.isArray(trueValue) ? trueValue : [trueValue];
			const falseArray = Array.isArray(falseValue) ? falseValue : [falseValue];

			// Filter based on condition array
			condition.forEach((cond, index) => {
				if (cond) {
					if (index < trueArray.length) {
						trueResults.push(trueArray[index]);
					}
				} else {
					if (index < falseArray.length) {
						falseResults.push(falseArray[index]);
					}
				}
			});

			// Output both arrays
			context.setOutputValue('trueOut', trueResults);
			context.setOutputValue('falseOut', falseResults);
			// For backward compatibility, output true array as 'out'
			context.setOutputValue('out', trueResults);
		} else {
			// Single condition - standard behavior
			if (condition) {
				context.setOutputValue('out', trueValue);
			} else {
				context.setOutputValue('out', falseValue);
			}
		}
	}
};

/**
 * Compare node - compares two values
 * Supports both single values and arrays:
 * - Single values: outputs a single boolean
 * - Arrays: performs element-wise comparison and outputs an array of booleans
 */
export const CompareNode: NodeDefinition = {
	type: 'Compare',
	category: 'control',
	description: 'Compares two values using a specified operator. Supports element-wise array comparison.',
	inputs: [
		{ name: 'a', type: 'number | string' },
		{ name: 'b', type: 'number | string' }
	],
	outputs: [
		{ name: 'out', type: 'boolean' }
	],
	execute(context) {
		const a = context.getInputValue('a');
		const b = context.getInputValue('b');
		const operator = context.getNodeData().operator || '==';

		const compare = (val1: any, val2: any): boolean => {
			switch (operator) {
				case '==':
					return val1 == val2;
				case '===':
					return val1 === val2;
				case '!=':
					return val1 != val2;
				case '!==':
					return val1 !== val2;
				case '>':
					return val1 > val2;
				case '>=':
					return val1 >= val2;
				case '<':
					return val1 < val2;
				case '<=':
					return val1 <= val2;
				default:
					throw new Error(`Unknown operator: ${operator}`);
			}
		};

		// Array-aware comparison
		if (Array.isArray(a) || Array.isArray(b)) {
			const aArray = Array.isArray(a) ? a : [a];
			const bArray = Array.isArray(b) ? b : [b];
			const maxLength = Math.max(aArray.length, bArray.length);
			const results: boolean[] = [];

			for (let i = 0; i < maxLength; i++) {
				const aVal = i < aArray.length ? aArray[i] : aArray[aArray.length - 1];
				const bVal = i < bArray.length ? bArray[i] : bArray[bArray.length - 1];
				results.push(compare(aVal, bVal));
			}

			context.setOutputValue('out', results);
		} else {
			// Single value comparison
			const result = compare(a, b);
			context.setOutputValue('out', result);
		}
	}
};

/**
 * Switch node - multi-case branching based on a value
 * Routes input to different outputs based on the value matching a case
 */
export const SwitchNode: NodeDefinition = {
	type: 'Switch',
	category: 'control',
	description: 'Routes input to different outputs based on case matching',
	inputs: [
		{ name: 'value', type: 'any' }
	],
	outputs: [
		{ name: 'default', type: 'any' }
	],
	execute(context) {
		const value = context.getInputValue('value');
		const cases = context.getNodeData().cases || {};
		
		// Check if value matches any case
		let matched = false;
		for (const [caseValue, outputPort] of Object.entries(cases)) {
			if (String(value) === String(caseValue)) {
				context.setOutputValue(outputPort as string, value);
				matched = true;
				break;
			}
		}

		// If no match, output to default
		if (!matched) {
			context.setOutputValue('default', value);
		}
	}
};
