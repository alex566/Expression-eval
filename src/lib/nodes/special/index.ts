import type { NodeDefinition } from '../../dataflow/types';

/**
 * CreateObject node - creates an object from dynamic input pins
 * Each input pin becomes a property in the output object
 * Supports custom property names via pin configuration
 * 
 * Example:
 * - Input pins: name (value: "John"), age (value: 30)
 * - Output: { name: "John", age: 30 }
 */
export const CreateObjectNode: NodeDefinition = {
	type: 'CreateObject',
	category: 'special',
	description: 'Creates an object with properties from input pins',
	inputs: [], // Dynamic inputs - each becomes an object property
	outputs: [
		{ name: 'out', type: 'object' }
	],
	execute(context) {
		const result: Record<string, any> = {};
		const data = context.getNodeData();
		const pinNames = data.pinNames || [];
		
		// If we have custom pin names, use them
		if (pinNames.length > 0) {
			for (const pinName of pinNames) {
				const value = context.getInputValue(pinName);
				if (value !== undefined) {
					result[pinName] = value;
				}
			}
		} else {
			// Otherwise, collect all inputs with in0, in1, in2, ... naming
			let index = 0;
			while (true) {
				const value = context.getInputValue(`in${index}`);
				if (value === undefined) break;
				result[`prop${index}`] = value;
				index++;
			}
		}
		
		context.setOutputValue('out', result);
	}
};

/**
 * Input node - Provides access to input data
 * In CEL mode, this compiles to 'input' which provides access to the entire input object
 * Dynamic output pins can be defined based on the input data structure
 */
export const InputNode: NodeDefinition = {
	type: 'Input',
	category: 'special',
	description: 'Provides access to input data passed to the graph',
	inputs: [],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	execute(context) {
		// In CEL mode, this returns the input data reference
		// The actual input will be provided at evaluation time
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
