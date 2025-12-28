import type { NodeDefinition } from '../../dataflow/types';

/**
 * Add node - adds all connected input values together
 * Dynamically accepts any number of inputs (in0, in1, in2, ...)
 * For array operations, use Map/Filter/Reduce nodes
 */
export const AddNode: NodeDefinition = {
	type: 'Add',
	category: 'math',
	description: 'Adds all connected input values together. For array operations, use Map node.',
	inputs: [], // Dynamic inputs - will accept in0, in1, in2, etc.
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		const inputs: any[] = [];
		let index = 0;
		
		// Collect all inputs
		while (true) {
			const value = context.getInputValue(`in${index}`);
			if (value === undefined) break;
			inputs.push(value);
			index++;
		}

		// Standard single value addition
		let result = 0;
		for (const input of inputs) {
			result += Number(input) || 0;
		}
		context.setOutputValue('out', result);
	}
};

/**
 * Subtract node - subtracts all inputs from the first input
 * First input (in0) is the base, subsequent inputs (in1, in2, ...) are subtracted from it
 * For array operations, use Map/Filter/Reduce nodes
 */
export const SubtractNode: NodeDefinition = {
	type: 'Subtract',
	category: 'math',
	description: 'Subtracts all subsequent inputs from the first input. For array operations, use Map node.',
	inputs: [], // Dynamic inputs - will accept in0, in1, in2, etc.
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		const inputs: any[] = [];
		let index = 0;
		
		// Collect all inputs
		while (true) {
			const value = context.getInputValue(`in${index}`);
			if (value === undefined) break;
			inputs.push(value);
			index++;
		}

		if (inputs.length === 0) {
			context.setOutputValue('out', 0);
			return;
		}

		// Standard single value subtraction
		let result = Number(inputs[0]) || 0;
		for (let i = 1; i < inputs.length; i++) {
			result -= Number(inputs[i]) || 0;
		}
		context.setOutputValue('out', result);
	}
};

/**
 * Multiply node - multiplies all connected input values together
 * Dynamically accepts any number of inputs (in0, in1, in2, ...)
 * For array operations, use Map/Filter/Reduce nodes
 */
export const MultiplyNode: NodeDefinition = {
	type: 'Multiply',
	category: 'math',
	description: 'Multiplies all connected input values together. For array operations, use Map node.',
	inputs: [], // Dynamic inputs - will accept in0, in1, in2, etc.
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		const inputs: any[] = [];
		let index = 0;
		
		// Collect all inputs
		while (true) {
			const value = context.getInputValue(`in${index}`);
			if (value === undefined) break;
			inputs.push(value);
			index++;
		}

		if (inputs.length === 0) {
			context.setOutputValue('out', 0);
			return;
		}

		// Standard single value multiplication
		let result = 1;
		for (const input of inputs) {
			result *= Number(input) || 0;
		}
		context.setOutputValue('out', result);
	}
};

/**
 * Divide node - divides the first input by subsequent inputs
 * First input (in0) is the dividend, subsequent inputs (in1, in2, ...) are divisors
 * For array operations, use Map/Filter/Reduce nodes
 */
export const DivideNode: NodeDefinition = {
	type: 'Divide',
	category: 'math',
	description: 'Divides the first input by all subsequent inputs. For array operations, use Map node.',
	inputs: [], // Dynamic inputs - will accept in0, in1, in2, etc.
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		const inputs: any[] = [];
		let index = 0;
		
		// Collect all inputs
		while (true) {
			const value = context.getInputValue(`in${index}`);
			if (value === undefined) break;
			inputs.push(value);
			index++;
		}

		if (inputs.length === 0) {
			context.setOutputValue('out', 0);
			return;
		}

		// Standard single value division
		let result = Number(inputs[0]) || 0;
		for (let i = 1; i < inputs.length; i++) {
			const divisor = Number(inputs[i]) || 0;
			if (divisor === 0) {
				throw new Error('Division by zero in Divide node');
			}
			result /= divisor;
		}
		context.setOutputValue('out', result);
	}
};

/**
 * Modulo node - computes the remainder of division
 * First input (in0) is the dividend, second input (in1) is the divisor
 * For array operations, use Map/Filter/Reduce nodes
 */
export const ModuloNode: NodeDefinition = {
	type: 'Modulo',
	category: 'math',
	description: 'Computes the remainder of division (modulo). For array operations, use Map node.',
	inputs: [],
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		const dividend = context.getInputValue('in0');
		const divisor = context.getInputValue('in1');

		if (dividend === undefined || divisor === undefined) {
			context.setOutputValue('out', 0);
			return;
		}

		// Standard single value modulo
		const divVal = Number(divisor) || 0;
		if (divVal === 0) {
			throw new Error('Division by zero in Modulo node');
		}
		const result = (Number(dividend) || 0) % divVal;
		context.setOutputValue('out', result);
	}
};
