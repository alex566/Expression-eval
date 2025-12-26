import type { NodeDefinition } from '../../dataflow/types';

/**
 * Start node - provides initial values to the graph
 * Dynamically creates output ports based on the input data
 */
export const StartNode: NodeDefinition = {
	type: 'Start',
	category: 'special',
	description: 'Provides initial input values to the graph',
	inputs: [],
	outputs: [], // Will be dynamically determined from data
	execute(context) {
		const value = context.getNodeData().value || {};

		// Output each property as a separate port
		if (typeof value === 'object' && value !== null) {
			for (const [key, val] of Object.entries(value)) {
				context.setOutputValue(key, val);
			}
		} else {
			context.setOutputValue('out', value);
		}
	}
};

/**
 * Collect node - collects values into a single output
 */
export const CollectNode: NodeDefinition = {
	type: 'Collect',
	category: 'special',
	description: 'Collects input values into a single output object',
	inputs: [
		{ name: 'result', type: 'any' },
		{ name: 'result1', type: 'any' },
		{ name: 'result2', type: 'any' },
		{ name: 'result3', type: 'any' }
	],
	outputs: [
		{ name: 'out', type: 'object' }
	],
	execute(context) {
		const data = context.getNodeData();
		const result: Record<string, any> = {};

		// Collect all inputs
		// For the example, we'll collect specific named inputs
		const inputNames = data.inputs || ['result'];

		for (const name of inputNames) {
			const value = context.getInputValue(name);
			if (value !== undefined) {
				result[name] = value;
			}
		}

		context.setOutputValue('out', result);
	}
};

/**
 * Output node - marks final output values
 * Dynamically creates input ports based on the configuration
 */
export const OutputNode: NodeDefinition = {
	type: 'Output',
	category: 'special',
	description: 'Marks values as final outputs of the graph',
	inputs: [], // Will be dynamically determined from data
	outputs: [],
	execute(context) {
		const data = context.getNodeData();
		const outputNames = data.outputs || ['output'];
		
		// Process each configured output
		for (const name of outputNames) {
			const value = context.getInputValue(name);
			if (value !== undefined) {
				context.setOutputValue(name, value);
			}
		}
	}
};
