import type { NodeDefinition, TypeInferenceContext } from '../../dataflow/types';

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
	},
	inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
		// Infer object type from input types
		// Build a map type with known properties
		const data = context.getNodeData();
		const pinNames = data.pinNames || [];
		
		if (pinNames.length === 0) {
			// Generic object type if no pins defined
			return { out: 'map(string, dyn)' };
		}
		
		// Build structured object type
		// Note: CEL doesn't have TypeScript-style object types, so we use map
		// In a more sophisticated implementation, we could track property types
		return { out: 'map(string, dyn)' };
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
	},
	inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
		const data = context.getNodeData();
		const inputSchema = data.inputSchema;
		const outputTypes: Record<string, string> = {};
		
		// If we have an input schema, infer types from it
		if (inputSchema && typeof inputSchema === 'object') {
			for (const [key, schemaType] of Object.entries(inputSchema)) {
				// Map schema types to CEL types
				let celType = 'dyn';
				if (schemaType === 'string') {
					celType = 'string';
				} else if (schemaType === 'number') {
					celType = 'double';
				} else if (schemaType === 'boolean') {
					celType = 'bool';
				} else if (schemaType === 'array') {
					celType = 'list(dyn)';
				} else if (schemaType === 'object') {
					celType = 'map(string, dyn)';
				}
				outputTypes[key] = celType;
			}
		}
		
		// Always include the generic 'out' port
		outputTypes['out'] = 'dyn';
		
		return outputTypes;
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
