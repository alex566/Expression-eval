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

/**
 * Range node - generates a series of numbers
 * Creates an array from start to end with a given step
 * 
 * Replaces: Array.from({length: Math.floor((end - start) / step) + 1}, (_, i) => start + i * step)
 */
export const RangeNode: NodeDefinition = {
	type: 'Range',
	category: 'array',
	description: 'Generate a series of numbers from start to end with step',
	inputs: [
		{ name: 'start', type: 'number' },
		{ name: 'end', type: 'number' },
		{ name: 'step', type: 'number' }
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	execute(context) {
		// Compiled to JavaScript during evaluation
		const start = context.getInputValue('start') || 0;
		const end = context.getInputValue('end') || 0;
		const step = context.getInputValue('step') || 1;
		
		const length = Math.floor((end - start) / step) + 1;
		const range = Array.from({length}, (_, i) => start + i * step);
		context.setOutputValue('out', range);
	}
};

/**
 * Length node - gets the length of an array
 * 
 * Replaces: array.length in expressions
 */
export const LengthNode: NodeDefinition = {
	type: 'Length',
	category: 'array',
	description: 'Get the length of an array',
	inputs: [
		{ name: 'array', type: 'array' }
	],
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		// Compiled to JavaScript during evaluation
		const inputArray = context.getInputValue('array');
		
		if (!Array.isArray(inputArray)) {
			throw new Error('Length node requires an array input');
		}
		
		context.setOutputValue('out', inputArray.length);
	}
};

/**
 * GetItem node - accesses an array element by index
 * 
 * Replaces: array[index] in expressions
 */
export const GetItemNode: NodeDefinition = {
	type: 'GetItem',
	category: 'array',
	description: 'Access an array element by index',
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'index', type: 'number' }
	],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	execute(context) {
		// Compiled to JavaScript during evaluation
		const inputArray = context.getInputValue('array');
		const index = context.getInputValue('index');
		
		if (!Array.isArray(inputArray)) {
			throw new Error('GetItem node requires an array input');
		}
		
		context.setOutputValue('out', inputArray[index]);
	}
};

/**
 * Concat node - concatenates multiple arrays into one
 * 
 * Supports dynamic number of array inputs
 */
export const ConcatNode: NodeDefinition = {
	type: 'Concat',
	category: 'array',
	description: 'Concatenate multiple arrays into one',
	inputs: [
		{ name: 'array1', type: 'array' },
		{ name: 'array2', type: 'array' }
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	execute(context) {
		// Compiled to JavaScript during evaluation
		const array1 = context.getInputValue('array1');
		const array2 = context.getInputValue('array2');
		
		if (!Array.isArray(array1) || !Array.isArray(array2)) {
			throw new Error('Concat node requires array inputs');
		}
		
		context.setOutputValue('out', array1.concat(array2));
	}
};
