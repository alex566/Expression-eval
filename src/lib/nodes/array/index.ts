import type { NodeDefinition } from '../../dataflow/types';

/**
 * Map node - applies a transformation to each element of an array
 * Uses Expression node: receives a JavaScript expression via the 'expression' input pin
 * 
 * Type inference is handled by TypeScript factory API (array.map)
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
	}
	// inferOutputTypes removed - TypeScript factory API handles array type inference
};

/**
 * Filter node - filters elements of an array using a predicate
 * Uses Expression node: receives a JavaScript expression via the 'expression' input pin
 * 
 * Type inference is handled by TypeScript factory API (array.filter)
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
	}
	// inferOutputTypes removed - TypeScript factory API handles array type preservation
};

/**
 * Reduce node - reduces an array to a single value using an accumulator
 * Uses Expression node: receives a JavaScript expression via the 'expression' input pin
 * 
 * Type inference is handled by TypeScript factory API (array.reduce)
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
	// inferOutputTypes removed - TypeScript factory API handles reduce type inference
};
