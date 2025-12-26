import type { NodeDefinition } from '../../dataflow/types';

/**
 * Add node - adds all connected input values together
 * Dynamically accepts any number of inputs (in0, in1, in2, ...)
 */
export const AddNode: NodeDefinition = {
	type: 'Add',
	category: 'math',
	description: 'Adds all connected input values together',
	inputs: [], // Dynamic inputs - will accept in0, in1, in2, etc.
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		let result = 0;
		let index = 0;
		
		// Try to get values from numbered inputs (in0, in1, in2, ...)
		while (true) {
			const value = context.getInputValue(`in${index}`);
			if (value === undefined) break;
			result += Number(value) || 0;
			index++;
		}
		
		context.setOutputValue('out', result);
	}
};

/**
 * Subtract node - subtracts all inputs from the first input
 * First input (in0) is the base, subsequent inputs (in1, in2, ...) are subtracted from it
 */
export const SubtractNode: NodeDefinition = {
	type: 'Subtract',
	category: 'math',
	description: 'Subtracts all subsequent inputs from the first input',
	inputs: [], // Dynamic inputs - will accept in0, in1, in2, etc.
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		const firstValue = context.getInputValue('in0');
		let result = Number(firstValue) || 0;
		let index = 1;
		
		// Subtract all subsequent inputs from the first
		while (true) {
			const value = context.getInputValue(`in${index}`);
			if (value === undefined) break;
			result -= Number(value) || 0;
			index++;
		}
		
		context.setOutputValue('out', result);
	}
};

/**
 * Multiply node - multiplies all connected input values together
 * Dynamically accepts any number of inputs (in0, in1, in2, ...)
 */
export const MultiplyNode: NodeDefinition = {
	type: 'Multiply',
	category: 'math',
	description: 'Multiplies all connected input values together',
	inputs: [], // Dynamic inputs - will accept in0, in1, in2, etc.
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		let result = 1;
		let index = 0;
		let hasInput = false;
		
		// Try to get values from numbered inputs (in0, in1, in2, ...)
		while (true) {
			const value = context.getInputValue(`in${index}`);
			if (value === undefined) break;
			result *= Number(value) || 0;
			hasInput = true;
			index++;
		}
		
		// If no inputs, result should be 0
		if (!hasInput) {
			result = 0;
		}
		
		context.setOutputValue('out', result);
	}
};

/**
 * Divide node - divides the first input by subsequent inputs
 * First input (in0) is the dividend, subsequent inputs (in1, in2, ...) are divisors
 */
export const DivideNode: NodeDefinition = {
	type: 'Divide',
	category: 'math',
	description: 'Divides the first input by all subsequent inputs',
	inputs: [], // Dynamic inputs - will accept in0, in1, in2, etc.
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		const firstValue = context.getInputValue('in0');
		let result = Number(firstValue) || 0;
		let index = 1;
		
		// Divide by all subsequent inputs
		while (true) {
			const value = context.getInputValue(`in${index}`);
			if (value === undefined) break;
			const divisor = Number(value) || 0;
			if (divisor === 0) {
				throw new Error('Division by zero in Divide node');
			}
			result /= divisor;
			index++;
		}
		
		context.setOutputValue('out', result);
	}
};
