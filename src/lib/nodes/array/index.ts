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
		// Map nodes are compiled to CEL at graph compilation time
		// This execute method is for compatibility but won't be used in CEL mode
		const inputArray = context.getInputValue('array');
		const expression = context.getInputValue('expression');
		
		if (!Array.isArray(inputArray)) {
			throw new Error('Map node requires an array input');
		}
		
		if (!expression) {
			throw new Error('Map node requires an expression');
		}
		
		// In CEL mode, this would be compiled to: array.map(element, expression)
		// For now, just pass through the array
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
		// Filter nodes are compiled to CEL at graph compilation time
		const inputArray = context.getInputValue('array');
		const expression = context.getInputValue('expression');
		
		if (!Array.isArray(inputArray)) {
			throw new Error('Filter node requires an array input');
		}
		
		if (!expression) {
			throw new Error('Filter node requires an expression');
		}
		
		// In CEL mode, this would be compiled to: array.filter(element, expression)
		// For now, just pass through the array
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
		// Reduce nodes are compiled to CEL at graph compilation time
		const inputArray = context.getInputValue('array');
		const initialValue = context.getInputValue('initial');
		const expression = context.getInputValue('expression');
		
		if (!Array.isArray(inputArray)) {
			throw new Error('Reduce node requires an array input');
		}
		
		if (!expression) {
			throw new Error('Reduce node requires an expression');
		}
		
		// In CEL mode, this would be compiled to a custom reduce function
		// For now, just return the initial value
		context.setOutputValue('out', initialValue);
	}
};


