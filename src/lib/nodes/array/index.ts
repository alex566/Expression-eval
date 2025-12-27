import type { NodeDefinition, Graph } from '../../dataflow/types';
import { GraphEvaluator } from '../../dataflow/evaluator';
import { nodeRegistry } from '../../dataflow/registry';

/**
 * Map node - applies a transformation subgraph to each element of an array
 * The subgraph receives the current element and produces the transformed output
 */
export const MapNode: NodeDefinition = {
	type: 'Map',
	category: 'array',
	description: 'Maps each element of an array through a transformation subgraph',
	hasSubgraph: true,
	inputs: [
		{ name: 'array', type: 'array' }
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	async execute(context) {
		const inputArray = context.getInputValue('array');
		const nodeData = context.getNodeData();
		const subgraph = nodeData.subgraph as Graph | undefined;

		if (!Array.isArray(inputArray)) {
			throw new Error('Map node requires an array input');
		}

		if (!subgraph) {
			// No subgraph defined, pass through the array
			context.setOutputValue('out', inputArray);
			return;
		}

		// Process each element through the subgraph
		const results: any[] = [];
		for (const element of inputArray) {
			// Create a modified subgraph with the current element as input
			const modifiedGraph = createSubgraphWithInput(subgraph, element);
			
			// Evaluate the subgraph
			const evaluator = new GraphEvaluator(modifiedGraph, nodeRegistry);
			const result = await evaluator.evaluate();

			if (!result.success) {
				throw new Error(`Map subgraph evaluation failed: ${result.error}`);
			}

			// Extract the output from the subgraph
			const output = extractSubgraphOutput(result.outputs);
			results.push(output);
		}

		context.setOutputValue('out', results);
	}
};

/**
 * Filter node - filters elements of an array using a predicate subgraph
 * The subgraph receives the current element and produces a boolean indicating if it should be included
 */
export const FilterNode: NodeDefinition = {
	type: 'Filter',
	category: 'array',
	description: 'Filters array elements using a predicate subgraph',
	hasSubgraph: true,
	inputs: [
		{ name: 'array', type: 'array' }
	],
	outputs: [
		{ name: 'out', type: 'array' }
	],
	async execute(context) {
		const inputArray = context.getInputValue('array');
		const nodeData = context.getNodeData();
		const subgraph = nodeData.subgraph as Graph | undefined;

		if (!Array.isArray(inputArray)) {
			throw new Error('Filter node requires an array input');
		}

		if (!subgraph) {
			// No subgraph defined, pass through the array
			context.setOutputValue('out', inputArray);
			return;
		}

		// Filter elements based on the subgraph predicate
		const results: any[] = [];
		for (const element of inputArray) {
			// Create a modified subgraph with the current element as input
			const modifiedGraph = createSubgraphWithInput(subgraph, element);
			
			// Evaluate the subgraph
			const evaluator = new GraphEvaluator(modifiedGraph, nodeRegistry);
			const result = await evaluator.evaluate();

			if (!result.success) {
				throw new Error(`Filter subgraph evaluation failed: ${result.error}`);
			}

			// Extract the output from the subgraph (should be boolean)
			const shouldInclude = extractSubgraphOutput(result.outputs);
			if (shouldInclude) {
				results.push(element);
			}
		}

		context.setOutputValue('out', results);
	}
};

/**
 * Reduce node - reduces an array to a single value using an accumulator subgraph
 * The subgraph receives the accumulator and current element, and produces the next accumulator value
 */
export const ReduceNode: NodeDefinition = {
	type: 'Reduce',
	category: 'array',
	description: 'Reduces an array to a single value using an accumulator subgraph',
	hasSubgraph: true,
	inputs: [
		{ name: 'array', type: 'array' },
		{ name: 'initial', type: 'any' }
	],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	async execute(context) {
		const inputArray = context.getInputValue('array');
		const initialValue = context.getInputValue('initial');
		const nodeData = context.getNodeData();
		const subgraph = nodeData.subgraph as Graph | undefined;

		if (!Array.isArray(inputArray)) {
			throw new Error('Reduce node requires an array input');
		}

		if (!subgraph) {
			// No subgraph defined, return initial value or undefined
			context.setOutputValue('out', initialValue);
			return;
		}

		// Reduce the array using the subgraph
		let accumulator = initialValue !== undefined ? initialValue : (inputArray.length > 0 ? inputArray[0] : undefined);
		const startIndex = initialValue !== undefined ? 0 : 1;

		for (let i = startIndex; i < inputArray.length; i++) {
			// Create a modified subgraph with accumulator and current element as inputs
			const modifiedGraph = createReduceSubgraphWithInputs(subgraph, accumulator, inputArray[i]);
			
			// Evaluate the subgraph
			const evaluator = new GraphEvaluator(modifiedGraph, nodeRegistry);
			const result = await evaluator.evaluate();

			if (!result.success) {
				throw new Error(`Reduce subgraph evaluation failed: ${result.error}`);
			}

			// Extract the output from the subgraph (next accumulator value)
			accumulator = extractSubgraphOutput(result.outputs);
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
