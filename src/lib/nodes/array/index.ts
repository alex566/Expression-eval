import type { NodeDefinition, Graph, FunctionDefinition } from '../../dataflow/types';
import { GraphEvaluator } from '../../dataflow/evaluator';
import { nodeRegistry } from '../../dataflow/registry';
import { createFunctionGraphWithInput, extractFunctionOutput } from '../../utils/function-helpers';

/**
 * Map node - applies a transformation to each element of an array
 * Supports both subgraph (legacy) and function reference modes
 * In function mode, passes each element as { element: value } to the function
 */
export const MapNode: NodeDefinition = {
	type: 'Map',
	category: 'array',
	description: 'Maps each element of an array through a transformation function',
	hasSubgraph: true,
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'function', type: 'any' } // Optional function reference
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	async execute(context) {
		const inputArray = context.getInputValue('array');
		const functionRef = context.getInputValue('function');
		const nodeData = context.getNodeData();
		const subgraph = nodeData.subgraph as Graph | undefined;

		if (!Array.isArray(inputArray)) {
			throw new Error('Map node requires an array input');
		}

		// Determine if we're using function reference or subgraph
		const functionName = functionRef || nodeData.functionName;
		const useFunctionMode = !!functionName;

		if (!useFunctionMode && !subgraph) {
			// No transformation defined, pass through the array
			context.setOutputValue('out', inputArray);
			return;
		}

		// Process each element
		const results: any[] = [];
		
		if (useFunctionMode) {
			// Function reference mode: pass { element: value } to the function
			const functions = nodeData.functions as FunctionDefinition[] | undefined;
			if (!functions) {
				throw new Error('Map node in function mode requires functions list');
			}

			const functionDef = functions.find(f => f.name === functionName);
			if (!functionDef) {
				throw new Error(`Function '${functionName}' not found`);
			}

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
		} else {
			// Subgraph mode (legacy)
			for (const element of inputArray) {
				const modifiedGraph = createSubgraphWithInput(subgraph!, element);
				
				const evaluator = new GraphEvaluator(modifiedGraph, nodeRegistry);
				const result = await evaluator.evaluate();

				if (!result.success) {
					throw new Error(`Map subgraph evaluation failed: ${result.error}`);
				}

				const output = extractSubgraphOutput(result.outputs);
				results.push(output);
			}
		}

		context.setOutputValue('out', results);
	}
};

/**
 * Filter node - filters elements of an array using a predicate
 * Supports both subgraph (legacy) and function reference modes
 * In function mode, passes each element as { element: value } to the function
 */
export const FilterNode: NodeDefinition = {
	type: 'Filter',
	category: 'array',
	description: 'Filters array elements using a predicate function',
	hasSubgraph: true,
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'function', type: 'any' } // Optional function reference
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	async execute(context) {
		const inputArray = context.getInputValue('array');
		const functionRef = context.getInputValue('function');
		const nodeData = context.getNodeData();
		const subgraph = nodeData.subgraph as Graph | undefined;

		if (!Array.isArray(inputArray)) {
			throw new Error('Filter node requires an array input');
		}

		// Determine if we're using function reference or subgraph
		const functionName = functionRef || nodeData.functionName;
		const useFunctionMode = !!functionName;

		if (!useFunctionMode && !subgraph) {
			// No predicate defined, pass through the array
			context.setOutputValue('out', inputArray);
			return;
		}

		// Filter elements
		const results: any[] = [];
		
		if (useFunctionMode) {
			// Function reference mode
			const functions = nodeData.functions as FunctionDefinition[] | undefined;
			if (!functions) {
				throw new Error('Filter node in function mode requires functions list');
			}

			const functionDef = functions.find(f => f.name === functionName);
			if (!functionDef) {
				throw new Error(`Function '${functionName}' not found`);
			}

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
		} else {
			// Subgraph mode (legacy)
			for (const element of inputArray) {
				const modifiedGraph = createSubgraphWithInput(subgraph!, element);
				
				const evaluator = new GraphEvaluator(modifiedGraph, nodeRegistry);
				const result = await evaluator.evaluate();

				if (!result.success) {
					throw new Error(`Filter subgraph evaluation failed: ${result.error}`);
				}

				const shouldInclude = extractSubgraphOutput(result.outputs);
				if (shouldInclude) {
					results.push(element);
				}
			}
		}

		context.setOutputValue('out', results);
	}
};

/**
 * Reduce node - reduces an array to a single value using an accumulator
 * Supports both subgraph (legacy) and function reference modes
 * In function mode, passes { accumulator, element } to the function
 */
export const ReduceNode: NodeDefinition = {
	type: 'Reduce',
	category: 'array',
	description: 'Reduces an array to a single value using an accumulator function',
	hasSubgraph: true,
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'initial', type: 'any' },
		{ name: 'function', type: 'any' } // Optional function reference
	],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	async execute(context) {
		const inputArray = context.getInputValue('array');
		const initialValue = context.getInputValue('initial');
		const functionRef = context.getInputValue('function');
		const nodeData = context.getNodeData();
		const subgraph = nodeData.subgraph as Graph | undefined;

		if (!Array.isArray(inputArray)) {
			throw new Error('Reduce node requires an array input');
		}

		// Determine if we're using function reference or subgraph
		const functionName = functionRef || nodeData.functionName;
		const useFunctionMode = !!functionName;

		if (!useFunctionMode && !subgraph) {
			// No reducer defined, return initial value or undefined
			context.setOutputValue('out', initialValue);
			return;
		}

		// Initialize accumulator
		let accumulator = initialValue !== undefined ? initialValue : (inputArray.length > 0 ? inputArray[0] : undefined);
		const startIndex = initialValue !== undefined ? 0 : 1;

		if (useFunctionMode) {
			// Function reference mode
			const functions = nodeData.functions as FunctionDefinition[] | undefined;
			if (!functions) {
				throw new Error('Reduce node in function mode requires functions list');
			}

			const functionDef = functions.find(f => f.name === functionName);
			if (!functionDef) {
				throw new Error(`Function '${functionName}' not found`);
			}

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
		} else {
			// Subgraph mode (legacy)
			for (let i = startIndex; i < inputArray.length; i++) {
				const modifiedGraph = createReduceSubgraphWithInputs(subgraph!, accumulator, inputArray[i]);
				
				const evaluator = new GraphEvaluator(modifiedGraph, nodeRegistry);
				const result = await evaluator.evaluate();

				if (!result.success) {
					throw new Error(`Reduce subgraph evaluation failed: ${result.error}`);
				}

				accumulator = extractSubgraphOutput(result.outputs);
			}
		}

		context.setOutputValue('out', accumulator);
	}
};

/**
 * Helper function to create a subgraph with a single input value
 * Finds the "Input" node in the subgraph and replaces it with a Value node
 */
function createSubgraphWithInput(subgraph: Graph, inputValue: any): Graph {
	const nodes = subgraph.nodes.map(node => {
		if (node.type === 'Input' || node.id === 'input' || node.id === 'element') {
			// Replace Input node with a Value node containing the current element
			return {
				...node,
				type: 'Value',
				data: { value: inputValue }
			};
		}
		return node;
	});

	return {
		nodes,
		edges: subgraph.edges
	};
}

/**
 * Helper function to create a reduce subgraph with accumulator and element inputs
 * Finds "accumulator" and "element" input nodes and replaces them with Value nodes
 */
function createReduceSubgraphWithInputs(subgraph: Graph, accumulator: any, element: any): Graph {
	const nodes = subgraph.nodes.map(node => {
		if (node.id === 'accumulator' || node.id === 'acc') {
			// Replace accumulator input with a Value node
			return {
				...node,
				type: 'Value',
				data: { value: accumulator }
			};
		}
		if (node.id === 'element' || node.id === 'current') {
			// Replace element input with a Value node
			return {
				...node,
				type: 'Value',
				data: { value: element }
			};
		}
		return node;
	});

	return {
		nodes,
		edges: subgraph.edges
	};
}

/**
 * Helper function to extract the output value from subgraph evaluation results
 * Looks for an Output node's value or the last computed value
 */
function extractSubgraphOutput(outputs: Record<string, any>): any {
	// Look for an output node's output
	for (const [key, value] of Object.entries(outputs)) {
		if (key.includes('output.') || key.includes('result.')) {
			return value;
		}
	}

	// If no explicit output node, return the last computed value
	const values = Object.values(outputs);
	return values.length > 0 ? values[values.length - 1] : undefined;
}
