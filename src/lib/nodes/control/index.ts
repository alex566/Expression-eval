import type { NodeDefinition } from '../../dataflow/types';

/**
 * If node - conditional branching
 * Outputs either the true or false value based on condition
 * Can accept either a boolean value or a CEL expression that returns boolean
 */
export const IfNode: NodeDefinition = {
	type: 'If',
	category: 'control',
	description: 'Conditional execution based on a condition. Can accept boolean or expression.',
	inputs: [
		{ name: 'condition', type: 'boolean | string' }, // boolean or CEL expression
		{ name: 'true', type: 'any' },
		{ name: 'false', type: 'any' }
	],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	execute(context) {
		const condition = context.getInputValue('condition');
		const trueValue = context.getInputValue('true');
		const falseValue = context.getInputValue('false');

		if (Array.isArray(condition)) {
			throw new Error('If node does not support array conditions.');
		}

		// If condition is a string, it's a CEL expression - will be compiled
		// If it's a boolean, use it directly
		if (typeof condition === 'boolean') {
			if (condition) {
				context.setOutputValue('out', trueValue);
			} else {
				context.setOutputValue('out', falseValue);
			}
		} else {
			// In CEL mode, this will be compiled to: condition ? true : false
			// For now, just output the true value as fallback
			context.setOutputValue('out', trueValue);
		}
	}
};

/**
 * Compare node - compares two values
 * Outputs a single boolean result
 * For array comparison operations, use Map node with a comparison function
 */
export const CompareNode: NodeDefinition = {
	type: 'Compare',
	category: 'control',
	description: 'Compares two values using a specified operator. For array comparisons, use Map node.',
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

		if (Array.isArray(a) || Array.isArray(b)) {
			throw new Error('Compare node does not support array inputs. Use Map node with a comparison function for array comparisons.');
		}

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

		// Single value comparison
		const result = compare(a, b);
		context.setOutputValue('out', result);
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
