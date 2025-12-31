import type { NodeDefinition, TypeInferenceContext } from '../../dataflow/types';

/**
 * CreateObject node - creates an object from dynamic input pins
 * Each input pin becomes a property in the output object
 * Supports custom property names via pin configuration
 * 
 * Example:
 * - Input pins: name (value: "John"), age (value: 30)
 * - Output: { name: "John", age: 30 }
 * 
 * Type inference is handled by TypeScript factory API (object literal)
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
	// inferOutputTypes removed - TypeScript factory API handles object type inference
};

/**
 * Input node - Provides access to input data
 * In JavaScript mode, this compiles to 'input' which provides access to the entire input object
 * Dynamic output pins can be defined based on the input data structure
 * 
 * This is the ONLY node where explicit type casting from schema is allowed
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
		// In JavaScript mode, this returns the input data reference
		// The actual input will be provided at evaluation time
		const value = context.getNodeData().value;
		context.setOutputValue('out', value);
	},
	inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
		const data = context.getNodeData();
		const inputSchema = data.inputSchema;
		const inputSchemaTypes = data.inputSchemaTypes;
		const outputTypes: Record<string, string> = {};
		
		// If we have an input schema, infer types from it
		// This is the ONLY place where explicit schema-based type casting is allowed
		if (inputSchema && typeof inputSchema === 'object') {
			for (const [key, schemaValue] of Object.entries(inputSchema)) {
				let type = 'any';
				
				// Use explicitly defined type from schema if available
				if (inputSchemaTypes && inputSchemaTypes[key]) {
					type = inputSchemaTypes[key] as string;
				} else {
					// Infer from schema value
					if (typeof schemaValue === 'string') {
						type = 'string';
					} else if (typeof schemaValue === 'number') {
						type = 'number';
					} else if (typeof schemaValue === 'boolean') {
						type = 'boolean';
					} else if (Array.isArray(schemaValue)) {
						type = 'unknown[]';
					} else if (typeof schemaValue === 'object') {
						type = 'object';
					}
				}
				
				outputTypes[key] = type;
			}
		}
		
		// Always include the generic 'out' port
		outputTypes['out'] = 'any';
		
		return outputTypes;
	}
};

/**
 * Output node - marks final output values
 * Dynamically creates input ports based on connected edges
 * Input pin names are inferred from the source output port names
 * 
 * Type inference is handled by TypeScript factory API (pass-through)
 */
export const OutputNode: NodeDefinition = {
	type: 'Output',
	category: 'special',
	description: 'Marks values as final outputs of the graph. Input pins are automatically inferred from connections.',
	inputs: [], // Will be dynamically determined from edges
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
	// inferOutputTypes removed - Output node has no outputs
};
