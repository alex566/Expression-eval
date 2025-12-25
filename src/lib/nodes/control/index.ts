import type { NodeDefinition } from '../../dataflow/types';

/**
 * If node - conditional branching
 */
export const IfNode: NodeDefinition = {
	type: 'If',
	category: 'control',
	description: 'Conditional execution based on a condition',
	execute(context) {
		const condition = context.getInputValue('condition');
		const trueValue = context.getInputValue('true');
		const falseValue = context.getInputValue('false');

		if (condition) {
			context.setOutputValue('out', trueValue);
		} else {
			context.setOutputValue('out', falseValue);
		}
	}
};

/**
 * Compare node - compares two values
 */
export const CompareNode: NodeDefinition = {
	type: 'Compare',
	category: 'control',
	description: 'Compares two values using a specified operator',
	execute(context) {
		const a = context.getInputValue('a');
		const b = context.getInputValue('b');
		const operator = context.getNodeData().operator || '==';

		let result = false;
		switch (operator) {
			case '==':
				result = a == b;
				break;
			case '===':
				result = a === b;
				break;
			case '!=':
				result = a != b;
				break;
			case '!==':
				result = a !== b;
				break;
			case '>':
				result = a > b;
				break;
			case '>=':
				result = a >= b;
				break;
			case '<':
				result = a < b;
				break;
			case '<=':
				result = a <= b;
				break;
			default:
				throw new Error(`Unknown operator: ${operator}`);
		}

		context.setOutputValue('out', result);
	}
};

/**
 * ForEach node - iterates over an array
 */
export const ForEachNode: NodeDefinition = {
	type: 'ForEach',
	category: 'control',
	description: 'Iterates over an array and processes each element',
	execute(context) {
		const array = context.getInputValue('array');
		if (!Array.isArray(array)) {
			context.setOutputValue('out', []);
			return;
		}

		// For simplicity, just output the array
		// In a more complex implementation, this would trigger sub-graph execution
		context.setOutputValue('out', array);
		context.setOutputValue('count', array.length);
	}
};

/**
 * Map node - transforms an array
 */
export const MapNode: NodeDefinition = {
	type: 'Map',
	category: 'control',
	description: 'Maps an array through a transformation',
	execute(context) {
		const array = context.getInputValue('array');
		const transform = context.getNodeData().transform;

		if (!Array.isArray(array)) {
			context.setOutputValue('out', []);
			return;
		}

		// For simplicity, just output the array
		// In a more complex implementation, this would apply a transformation
		context.setOutputValue('out', array);
	}
};
