import type { NodeDefinition } from '../../dataflow/types';

/**
 * Add node - adds all connected input values together
 * Dynamically accepts any number of inputs (in0, in1, in2, ...)
 * Array-aware: if any input is an array, performs element-wise addition
 */
export const AddNode: NodeDefinition = {
	type: 'Add',
	category: 'math',
	description: 'Adds all connected input values together. Array-aware for element-wise operations.',
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

		// Check if any input is an array
		const hasArray = inputs.some(input => Array.isArray(input));

		if (hasArray) {
			// Array-aware addition: element-wise operation
			const arrays = inputs.map(input => Array.isArray(input) ? input : [input]);
			const maxLength = Math.max(...arrays.map(arr => arr.length));
			const result: number[] = [];

			for (let i = 0; i < maxLength; i++) {
				let sum = 0;
				for (const arr of arrays) {
					const val = i < arr.length ? arr[i] : arr[arr.length - 1];
					sum += Number(val) || 0;
				}
				result.push(sum);
			}

			context.setOutputValue('out', result);
		} else {
			// Standard single value addition
			let result = 0;
			for (const input of inputs) {
				result += Number(input) || 0;
			}
			context.setOutputValue('out', result);
		}
	}
};

/**
 * Subtract node - subtracts all inputs from the first input
 * First input (in0) is the base, subsequent inputs (in1, in2, ...) are subtracted from it
 * Array-aware: if any input is an array, performs element-wise subtraction
 */
export const SubtractNode: NodeDefinition = {
	type: 'Subtract',
	category: 'math',
	description: 'Subtracts all subsequent inputs from the first input. Array-aware for element-wise operations.',
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

		// Check if any input is an array
		const hasArray = inputs.some(input => Array.isArray(input));

		if (hasArray) {
			// Array-aware subtraction: element-wise operation
			const arrays = inputs.map(input => Array.isArray(input) ? input : [input]);
			const maxLength = Math.max(...arrays.map(arr => arr.length));
			const result: number[] = [];

			for (let i = 0; i < maxLength; i++) {
				const firstVal = i < arrays[0].length ? arrays[0][i] : arrays[0][arrays[0].length - 1];
				let diff = Number(firstVal) || 0;

				for (let j = 1; j < arrays.length; j++) {
					const val = i < arrays[j].length ? arrays[j][i] : arrays[j][arrays[j].length - 1];
					diff -= Number(val) || 0;
				}
				result.push(diff);
			}

			context.setOutputValue('out', result);
		} else {
			// Standard single value subtraction
			let result = Number(inputs[0]) || 0;
			for (let i = 1; i < inputs.length; i++) {
				result -= Number(inputs[i]) || 0;
			}
			context.setOutputValue('out', result);
		}
	}
};

/**
 * Multiply node - multiplies all connected input values together
 * Dynamically accepts any number of inputs (in0, in1, in2, ...)
 * Array-aware: if any input is an array, performs element-wise multiplication
 */
export const MultiplyNode: NodeDefinition = {
	type: 'Multiply',
	category: 'math',
	description: 'Multiplies all connected input values together. Array-aware for element-wise operations.',
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

		// Check if any input is an array
		const hasArray = inputs.some(input => Array.isArray(input));

		if (hasArray) {
			// Array-aware multiplication: element-wise operation
			const arrays = inputs.map(input => Array.isArray(input) ? input : [input]);
			const maxLength = Math.max(...arrays.map(arr => arr.length));
			const result: number[] = [];

			for (let i = 0; i < maxLength; i++) {
				let product = 1;
				for (const arr of arrays) {
					const val = i < arr.length ? arr[i] : arr[arr.length - 1];
					product *= Number(val) || 0;
				}
				result.push(product);
			}

			context.setOutputValue('out', result);
		} else {
			// Standard single value multiplication
			let result = 1;
			for (const input of inputs) {
				result *= Number(input) || 0;
			}
			context.setOutputValue('out', result);
		}
	}
};

/**
 * Divide node - divides the first input by subsequent inputs
 * First input (in0) is the dividend, subsequent inputs (in1, in2, ...) are divisors
 * Array-aware: if any input is an array, performs element-wise division
 */
export const DivideNode: NodeDefinition = {
	type: 'Divide',
	category: 'math',
	description: 'Divides the first input by all subsequent inputs. Array-aware for element-wise operations.',
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

		// Check if any input is an array
		const hasArray = inputs.some(input => Array.isArray(input));

		if (hasArray) {
			// Array-aware division: element-wise operation
			const arrays = inputs.map(input => Array.isArray(input) ? input : [input]);
			const maxLength = Math.max(...arrays.map(arr => arr.length));
			const result: number[] = [];

			for (let i = 0; i < maxLength; i++) {
				const firstVal = i < arrays[0].length ? arrays[0][i] : arrays[0][arrays[0].length - 1];
				let quotient = Number(firstVal) || 0;

				for (let j = 1; j < arrays.length; j++) {
					const val = i < arrays[j].length ? arrays[j][i] : arrays[j][arrays[j].length - 1];
					const divisor = Number(val) || 0;
					if (divisor === 0) {
						throw new Error('Division by zero in Divide node');
					}
					quotient /= divisor;
				}
				result.push(quotient);
			}

			context.setOutputValue('out', result);
		} else {
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
	}
};
