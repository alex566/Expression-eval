import type { Graph } from '../dataflow/types';

/**
 * Helper function to create a function graph with an input object
 * Finds the "FunctionInput" node and replaces it with a Value node containing the input
 */
export function createFunctionGraphWithInput(graph: Graph, inputObject: any): Graph {
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
export function extractFunctionOutput(outputs: Record<string, any>): any {
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
