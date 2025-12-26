import type { NodeDefinition } from '../../dataflow/types';

/**
 * Add node - adds a value to the input
 */
export const AddNode: NodeDefinition = {
	type: 'Add',
	category: 'math',
	description: 'Adds a specified amount to the input value',
	inputs: [
		{ name: 'in', type: 'number' }
	],
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		const input = context.getInputValue('in');
		const amount = context.getNodeData().amount || 0;
		const result = (input || 0) + amount;
		context.setOutputValue('out', result);
	}
};

/**
 * Subtract node - subtracts a value from the input
 */
export const SubtractNode: NodeDefinition = {
	type: 'Subtract',
	category: 'math',
	description: 'Subtracts a specified amount from the input value',
	inputs: [
		{ name: 'in', type: 'number' }
	],
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		const input = context.getInputValue('in');
		const amount = context.getNodeData().amount || 0;
		const result = (input || 0) - amount;
		context.setOutputValue('out', result);
	}
};

/**
 * Multiply node - multiplies input by a value
 */
export const MultiplyNode: NodeDefinition = {
	type: 'Multiply',
	category: 'math',
	description: 'Multiplies the input value by a specified factor',
	inputs: [
		{ name: 'in', type: 'number' }
	],
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		const input = context.getInputValue('in');
		const factor = context.getNodeData().factor || 1;
		const result = (input || 0) * factor;
		context.setOutputValue('out', result);
	}
};

/**
 * Divide node - divides input by a value
 */
export const DivideNode: NodeDefinition = {
	type: 'Divide',
	category: 'math',
	description: 'Divides the input value by a specified divisor',
	inputs: [
		{ name: 'in', type: 'number' }
	],
	outputs: [
		{ name: 'out', type: 'number' }
	],
	execute(context) {
		const input = context.getInputValue('in');
		const divisor = context.getNodeData().divisor || 1;
		if (divisor === 0) {
			throw new Error('Division by zero in Divide node');
		}
		const result = (input || 0) / divisor;
		context.setOutputValue('out', result);
	}
};
