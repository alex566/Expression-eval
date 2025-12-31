import type { NodeDefinition, TypeInferenceContext } from '../../dataflow/types';

/**
 * Map node - applies a transformation to each element of an array
 * Uses Expression node: receives a JavaScript expression via the 'expression' input pin
 */
export const MapNode: NodeDefinition = {
	type: 'Map',
	category: 'array',
	description: 'Maps each element of an array through a JavaScript expression',
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'expression', type: 'string' } // JavaScript expression (from Expression node connection)
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	execute(context) {
		// NOTE: Map nodes are compiled to JavaScript: array.map(element => expression)
		// This execute method is for compatibility only.
		const inputArray = context.getInputValue('array');
		const expression = context.getInputValue('expression');
		
		if (!Array.isArray(inputArray)) {
			throw new Error('Map node requires an array input');
		}
		
		if (!expression) {
			throw new Error('Map node requires an expression');
		}
		
		// Mapping happens during JavaScript evaluation
		context.setOutputValue('out', inputArray);
	},
	inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
		// Map preserves array type structure
		const arrayType = context.getInputType('array');
		
		if (!arrayType) {
			return { out: 'unknown[]' };
		}
		
		// If it's an array type, preserve it
		if (arrayType.endsWith('[]') || arrayType === 'array') {
			return { out: arrayType };
		}
		
		return { out: 'unknown[]' };
	}
};

/**
 * Filter node - filters elements of an array using a predicate
 * Uses Expression node: receives a JavaScript expression via the 'expression' input pin
 */
export const FilterNode: NodeDefinition = {
	type: 'Filter',
	category: 'array',
	description: 'Filters array elements using a JavaScript expression predicate',
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'expression', type: 'string' } // JavaScript expression (from Expression node connection)
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	execute(context) {
		// NOTE: Filter nodes are compiled to JavaScript: array.filter(element => expression)
		// This execute method is for compatibility only.
		const inputArray = context.getInputValue('array');
		const expression = context.getInputValue('expression');
		
		if (!Array.isArray(inputArray)) {
			throw new Error('Filter node requires an array input');
		}
		
		if (!expression) {
			throw new Error('Filter node requires an expression');
		}
		
		// Filtering happens during JavaScript evaluation
		context.setOutputValue('out', inputArray);
	},
	inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
		// Filter preserves the exact array type
		const arrayType = context.getInputType('array');
		
		if (!arrayType) {
			return { out: 'unknown[]' };
		}
		
		// Filter doesn't change the type, just filters elements
		return { out: arrayType };
	}
};

/**
 * Reduce node - reduces an array to a single value using an accumulator
 * Uses Expression node: receives a JavaScript expression via the 'expression' input pin
 */
export const ReduceNode: NodeDefinition = {
	type: 'Reduce',
	category: 'array',
	description: 'Reduces an array to a single value using a JavaScript expression',
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'initial', type: 'any' },
		{ name: 'expression', type: 'string' } // JavaScript expression (from Expression node connection)
	],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	execute(context) {
		// NOTE: Reduce nodes are compiled to JavaScript: array.reduce((accumulator, element) => expression, initial)
		// This execute method is for compatibility only.
		const inputArray = context.getInputValue('array');
		const initialValue = context.getInputValue('initial');
		const expression = context.getInputValue('expression');
		
		if (!Array.isArray(inputArray)) {
			throw new Error('Reduce node requires an array input');
		}
		
		if (!expression) {
			throw new Error('Reduce node requires an expression');
		}
		
		// Reduce happens during JavaScript evaluation
		context.setOutputValue('out', initialValue);
	}
};

