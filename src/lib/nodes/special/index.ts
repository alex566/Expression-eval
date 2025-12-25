import type { NodeDefinition } from '../../dataflow/types';

/**
 * Start node - provides initial values to the graph
 */
export const StartNode: NodeDefinition = {
	type: 'Start',
	category: 'special',
	description: 'Provides initial input values to the graph',
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
 * Output node - marks a final output value
 */
export const OutputNode: NodeDefinition = {
	type: 'Output',
	category: 'special',
	description: 'Marks a value as a final output of the graph',
	execute(context) {
		const value = context.getInputValue('in');
		const name = context.getNodeData().name || 'output';
		context.setOutputValue(name, value);
	}
};
