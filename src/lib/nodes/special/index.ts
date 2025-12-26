import type { NodeDefinition } from '../../dataflow/types';

/**
 * Value node - provides a constant value
 * This node outputs a hardcoded value specified in its data
 */
export const ValueNode: NodeDefinition = {
	type: 'Value',
	category: 'special',
	description: 'Provides a constant value',
	inputs: [],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	execute(context) {
		const value = context.getNodeData().value;
		context.setOutputValue('out', value);
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
