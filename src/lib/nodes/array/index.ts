import type { NodeDefinition } from '../../dataflow/types';

/**
 * Map node - applies a transformation to each element of an array
 * Uses Expression node: receives a CEL expression via the 'expression' input pin
 */
export const MapNode: NodeDefinition = {
	type: 'Map',
	category: 'array',
	description: 'Maps each element of an array through a CEL expression',
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'expression', type: 'string' } // CEL expression (from Expression node connection)
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	execute(context) {
		// NOTE: In CEL mode, this execute method is NOT used.
		// Map nodes are compiled to CEL: array.map(element, expression)
		// This fallback is for compatibility with old execution path only.
		const inputArray = context.getInputValue('array');
		const expression = context.getInputValue('expression');
		
		if (!Array.isArray(inputArray)) {
			throw new Error('Map node requires an array input');
		}
		
		if (!expression) {
			throw new Error('Map node requires an expression');
		}
		
		// In CEL mode, mapping happens during CEL evaluation
		// This fallback just passes through the array unchanged
		context.setOutputValue('out', inputArray);
	}
};

/**
 * Filter node - filters elements of an array using a predicate
 * Uses Expression node: receives a CEL expression via the 'expression' input pin
 */
export const FilterNode: NodeDefinition = {
	type: 'Filter',
	category: 'array',
	description: 'Filters array elements using a CEL expression predicate',
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'expression', type: 'string' } // CEL expression (from Expression node connection)
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	execute(context) {
		// NOTE: In CEL mode, this execute method is NOT used.
		// Filter nodes are compiled to CEL: array.filter(element, expression)
		// This fallback is for compatibility with old execution path only.
		const inputArray = context.getInputValue('array');
		const expression = context.getInputValue('expression');
		
		if (!Array.isArray(inputArray)) {
			throw new Error('Filter node requires an array input');
		}
		
		if (!expression) {
			throw new Error('Filter node requires an expression');
		}
		
		// In CEL mode, filtering happens during CEL evaluation
		// This fallback just passes through the array unchanged
		context.setOutputValue('out', inputArray);
	}
};

/**
 * Reduce node - reduces an array to a single value using an accumulator
 * Uses Expression node: receives a CEL expression via the 'expression' input pin
 */
export const ReduceNode: NodeDefinition = {
	type: 'Reduce',
	category: 'array',
	description: 'Reduces an array to a single value using a CEL expression',
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'initial', type: 'any' },
		{ name: 'expression', type: 'string' } // CEL expression (from Expression node connection)
	],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	execute(context) {
		// NOTE: In CEL mode, this execute method is NOT used.
		// Reduce nodes are compiled to CEL (custom function needed)
		// This fallback is for compatibility with old execution path only.
		const inputArray = context.getInputValue('array');
		const initialValue = context.getInputValue('initial');
		const expression = context.getInputValue('expression');
		
		if (!Array.isArray(inputArray)) {
			throw new Error('Reduce node requires an array input');
		}
		
		if (!expression) {
			throw new Error('Reduce node requires an expression');
		}
		
		// In CEL mode, reduce would need a custom implementation
		// This fallback just returns the initial value unchanged
		context.setOutputValue('out', initialValue);
	}
};


