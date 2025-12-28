import type { NodeDefinition, Graph, FunctionDefinition } from '../../dataflow/types';
import { GraphEvaluator } from '../../dataflow/evaluator';
import { nodeRegistry } from '../../dataflow/registry';

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
 * FunctionInput node - represents the input to a function (JSON object)
 * This is the entry point for function graphs
 */
export const FunctionInputNode: NodeDefinition = {
	type: 'FunctionInput',
	category: 'function',
	description: 'Represents the input JSON object to a function',
	inputs: [],
	outputs: [
		{ name: 'out', type: 'object' }
	],
	execute(context) {
		// In function context, this will be replaced with a Value node containing the input object
		const value = context.getNodeData().value || {};
		context.setOutputValue('out', value);
	}
};

/**
 * Helper function to create a function graph with an input object
 * Finds the "FunctionInput" node and replaces it with a Value node containing the input
 */
function createFunctionGraphWithInput(graph: Graph, inputObject: any): Graph {
	const nodes = graph.nodes.map(node => {
		if (node.type === 'FunctionInput' || node.id === 'input' || node.id === 'functionInput') {
			// Replace FunctionInput node with a Value node containing the input object
			return {
				...node,
				type: 'Value',
				data: { value: inputObject }
			};
		}
		return node;
	});

	return {
		...graph,
		nodes,
		edges: graph.edges
	};
}

/**
 * Helper function to extract the output value from function evaluation results
 * Looks for an Output node's value or the last computed value
 */
function extractFunctionOutput(outputs: Record<string, any>): any {
	// Look for an output node's output
	for (const [key, value] of Object.entries(outputs)) {
		if (key.includes('output.') || key.includes('result.') || key.includes('return.')) {
			return value;
		}
	}

	// If no explicit output node, return the last computed value
	const values = Object.values(outputs);
	return values.length > 0 ? values[values.length - 1] : undefined;
}
