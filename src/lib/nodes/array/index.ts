import type { NodeDefinition, Graph, FunctionDefinition } from '../../dataflow/types';
import { GraphEvaluator } from '../../dataflow/evaluator';
import { nodeRegistry } from '../../dataflow/registry';
import { createFunctionGraphWithInput, extractFunctionOutput } from '../../utils/function-helpers';

/**
 * Map node - applies a transformation to each element of an array
 * Function-based: receives a function name/reference via the 'function' input pin
 * Passes each element as { element: value } to the function
 */
export const MapNode: NodeDefinition = {
	type: 'Map',
	category: 'array',
	description: 'Maps each element of an array through a transformation function',
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'function', type: 'string' } // Function name reference
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	async execute(context) {
		const inputArray = context.getInputValue('array');
		const functionName = context.getInputValue('function');
		const nodeData = context.getNodeData();

		if (!Array.isArray(inputArray)) {
			throw new Error('Map node requires an array input');
		}

		if (!functionName) {
			throw new Error('Map node requires a function name');
		}

		// Get the function definition from the graph's functions list
		const functions = nodeData.functions as FunctionDefinition[] | undefined;
		if (!functions) {
			throw new Error('Map node requires functions list in graph');
		}

		const functionDef = functions.find(f => f.name === functionName);
		if (!functionDef) {
			throw new Error(`Function '${functionName}' not found`);
		}

		// Process each element
		const results: any[] = [];
		for (const element of inputArray) {
			// Create input object with element property
			const inputObject = { element };
			const modifiedGraph = createFunctionGraphWithInput(functionDef.graph, inputObject);
			
			// Evaluate the function
			const evaluator = new GraphEvaluator(modifiedGraph, nodeRegistry);
			const result = await evaluator.evaluate();

			if (!result.success) {
				throw new Error(`Map function evaluation failed: ${result.error}`);
			}

			const output = extractFunctionOutput(result.outputs);
			results.push(output);
		}

		context.setOutputValue('out', results);
	}
};

/**
 * Filter node - filters elements of an array using a predicate
 * Function-based: receives a function name/reference via the 'function' input pin
 * Passes each element as { element: value } to the function
 */
export const FilterNode: NodeDefinition = {
	type: 'Filter',
	category: 'array',
	description: 'Filters array elements using a predicate function',
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'function', type: 'string' } // Function name reference
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	async execute(context) {
		const inputArray = context.getInputValue('array');
		const functionName = context.getInputValue('function');
		const nodeData = context.getNodeData();

		if (!Array.isArray(inputArray)) {
			throw new Error('Filter node requires an array input');
		}

		if (!functionName) {
			throw new Error('Filter node requires a function name');
		}

		// Get the function definition from the graph's functions list
		const functions = nodeData.functions as FunctionDefinition[] | undefined;
		if (!functions) {
			throw new Error('Filter node requires functions list in graph');
		}

		const functionDef = functions.find(f => f.name === functionName);
		if (!functionDef) {
			throw new Error(`Function '${functionName}' not found`);
		}

		// Filter elements
		const results: any[] = [];
		for (const element of inputArray) {
			// Create input object with element property
			const inputObject = { element };
			const modifiedGraph = createFunctionGraphWithInput(functionDef.graph, inputObject);
			
			// Evaluate the function
			const evaluator = new GraphEvaluator(modifiedGraph, nodeRegistry);
			const result = await evaluator.evaluate();

			if (!result.success) {
				throw new Error(`Filter function evaluation failed: ${result.error}`);
			}

			const shouldInclude = extractFunctionOutput(result.outputs);
			if (shouldInclude) {
				results.push(element);
			}
		}

		context.setOutputValue('out', results);
	}
};

/**
 * Reduce node - reduces an array to a single value using an accumulator
 * Function-based: receives a function name/reference via the 'function' input pin
 * Passes { accumulator, element } to the function
 */
export const ReduceNode: NodeDefinition = {
	type: 'Reduce',
	category: 'array',
	description: 'Reduces an array to a single value using an accumulator function',
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'initial', type: 'any' },
		{ name: 'function', type: 'string' } // Function name reference
	],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	async execute(context) {
		const inputArray = context.getInputValue('array');
		const initialValue = context.getInputValue('initial');
		const functionName = context.getInputValue('function');
		const nodeData = context.getNodeData();

		if (!Array.isArray(inputArray)) {
			throw new Error('Reduce node requires an array input');
		}

		if (!functionName) {
			throw new Error('Reduce node requires a function name');
		}

		// Get the function definition from the graph's functions list
		const functions = nodeData.functions as FunctionDefinition[] | undefined;
		if (!functions) {
			throw new Error('Reduce node requires functions list in graph');
		}

		const functionDef = functions.find(f => f.name === functionName);
		if (!functionDef) {
			throw new Error(`Function '${functionName}' not found`);
		}

		// Initialize accumulator
		let accumulator = initialValue !== undefined ? initialValue : (inputArray.length > 0 ? inputArray[0] : undefined);
		const startIndex = initialValue !== undefined ? 0 : 1;

		for (let i = startIndex; i < inputArray.length; i++) {
			// Create input object with accumulator and element properties
			const inputObject = { accumulator, element: inputArray[i] };
			const modifiedGraph = createFunctionGraphWithInput(functionDef.graph, inputObject);
			
			// Evaluate the function
			const evaluator = new GraphEvaluator(modifiedGraph, nodeRegistry);
			const result = await evaluator.evaluate();

			if (!result.success) {
				throw new Error(`Reduce function evaluation failed: ${result.error}`);
			}

			accumulator = extractFunctionOutput(result.outputs);
		}

		context.setOutputValue('out', accumulator);
	}
};

