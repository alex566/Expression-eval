import type { NodeDefinition, Graph, FunctionDefinition } from '../../dataflow/types';
import { GraphEvaluator } from '../../dataflow/evaluator';
import { nodeRegistry } from '../../dataflow/registry';
import { createFunctionGraphWithInput, extractFunctionOutput } from '../../utils/function-helpers';

/**
 * FunctionRef node - calls a function by name
 * Accepts a JSON object as input and returns the function's output
 */
export const FunctionRefNode: NodeDefinition = {
	type: 'FunctionRef',
	category: 'function',
	description: 'Calls a function by name with a JSON object input',
	inputs: [
		{ name: 'input', type: 'object' }
	],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	async execute(context) {
		const inputObject = context.getInputValue('input');
		const nodeData = context.getNodeData();
		const functionName = nodeData.functionName as string | undefined;

		if (!functionName) {
			throw new Error('FunctionRef node requires a functionName in data');
		}

		// Get the function definition from the graph's functions list
		const functions = nodeData.functions as FunctionDefinition[] | undefined;
		if (!functions) {
			throw new Error('FunctionRef node requires functions list in node data');
		}

		const functionDef = functions.find(f => f.name === functionName);
		if (!functionDef) {
			throw new Error(`Function '${functionName}' not found`);
		}

		// Create a modified function graph with the input object as a Value node
		const modifiedGraph = createFunctionGraphWithInput(functionDef.graph, inputObject || {});

		// Evaluate the function graph
		const evaluator = new GraphEvaluator(modifiedGraph, nodeRegistry);
		const result = await evaluator.evaluate();

		if (!result.success) {
			throw new Error(`Function '${functionName}' evaluation failed: ${result.error}`);
		}

		// Extract the output from the function
		const output = extractFunctionOutput(result.outputs);
		context.setOutputValue('out', output);
	}
};

/**
 * GetProperty node - extracts a property from a JSON object
 * Takes a JSON object input and outputs a single property value
 */
export const GetPropertyNode: NodeDefinition = {
	type: 'GetProperty',
	category: 'function',
	description: 'Extracts a property from a JSON object',
	inputs: [
		{ name: 'object', type: 'object' }
	],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	execute(context) {
		const inputObject = context.getInputValue('object');
		const nodeData = context.getNodeData();
		const propertyName = nodeData.property as string | undefined;

		if (!propertyName) {
			throw new Error('GetProperty node requires a property name in data');
		}

		if (typeof inputObject !== 'object' || inputObject === null) {
			throw new Error('GetProperty node requires an object input');
		}

		const value = inputObject[propertyName];
		context.setOutputValue('out', value);
	}
};

/**
 * FunctionInput node - generic object properties accessor
 * This is the entry point for function graphs and provides output pins for each property
 * It can also be used to access properties of any object in the graph
 */
export const FunctionInputNode: NodeDefinition = {
	type: 'FunctionInput',
	category: 'function',
	description: 'Generic object properties accessor with output pins for each property',
	inputs: [],
	outputs: [
		{ name: 'out', type: 'object' }
	],
	execute(context) {
		// In function context, this will be replaced with a Value node containing the input object
		const value = context.getNodeData().value || {};
		
		// Set the full object as 'out' output
		context.setOutputValue('out', value);
		
		// If value is an object, also set individual property outputs
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			for (const [key, val] of Object.entries(value)) {
				context.setOutputValue(key, val);
			}
		}
	}
};

/**
 * FunctionValue node - outputs a function name as a string value
 * This can be connected to Map/Filter/Reduce function input pins
 */
export const FunctionValueNode: NodeDefinition = {
	type: 'FunctionValue',
	category: 'function',
	description: 'Provides a function name as a value that can be connected to function pins',
	inputs: [],
	outputs: [
		{ name: 'out', type: 'string' }
	],
	execute(context) {
		const functionName = context.getNodeData().functionName as string | undefined;
		
		if (!functionName) {
			throw new Error('FunctionValue node requires a functionName in data');
		}

		context.setOutputValue('out', functionName);
	}
};
