import type { NodeDefinition } from '../../dataflow/types';

/**
 * CreateDate node - creates a Date object from string or number initializer
 * Accepts either a string (ISO date format) or number (timestamp) input
 */
export const CreateDateNode: NodeDefinition = {
	type: 'CreateDate',
	category: 'datetime',
	description: 'Creates a Date object from a string or number',
	inputs: [
		{ name: 'value', type: 'string | number' }
	],
	outputs: [
		{ name: 'out', type: 'Date' }
	],
	execute(context) {
		const value = context.getInputValue('value');
		let date: Date;
		
		if (value === undefined || value === null) {
			// If no input, create current date
			date = new Date();
		} else if (typeof value === 'number') {
			// Create date from timestamp
			date = new Date(value);
		} else if (typeof value === 'string') {
			// Create date from string
			date = new Date(value);
		} else {
			throw new Error('CreateDate: input must be a string or number');
		}
		
		if (isNaN(date.getTime())) {
			throw new Error('CreateDate: invalid date value');
		}
		
		context.setOutputValue('out', date);
	}
};

/**
 * AddDate node - adds time intervals to a Date
 * Supports adding seconds, minutes, hours, days, months, and years
 */
export const AddDateNode: NodeDefinition = {
	type: 'AddDate',
	category: 'datetime',
	description: 'Adds time intervals to a Date',
	inputs: [
		{ name: 'date', type: 'Date' },
		{ name: 'seconds', type: 'number' },
		{ name: 'minutes', type: 'number' },
		{ name: 'hours', type: 'number' },
		{ name: 'days', type: 'number' },
		{ name: 'months', type: 'number' },
		{ name: 'years', type: 'number' }
	],
	outputs: [
		{ name: 'out', type: 'Date' }
	],
	execute(context) {
		const inputDate = context.getInputValue('date');
		
		// Skip execution if date input is not available yet
		// The evaluator may call this node multiple times as inputs arrive
		// We only execute when the required date input is present
		if (inputDate === undefined) {
			return;
		}
		
		if (!(inputDate instanceof Date)) {
			throw new Error('AddDate: date input must be a Date object');
		}
		
		// Clone the date to avoid mutation
		const result = new Date(inputDate.getTime());
		
		// Add each time component if provided
		const seconds = context.getInputValue('seconds');
		if (seconds !== undefined) {
			result.setSeconds(result.getSeconds() + Number(seconds));
		}
		
		const minutes = context.getInputValue('minutes');
		if (minutes !== undefined) {
			result.setMinutes(result.getMinutes() + Number(minutes));
		}
		
		const hours = context.getInputValue('hours');
		if (hours !== undefined) {
			result.setHours(result.getHours() + Number(hours));
		}
		
		const days = context.getInputValue('days');
		if (days !== undefined) {
			result.setDate(result.getDate() + Number(days));
		}
		
		const months = context.getInputValue('months');
		if (months !== undefined) {
			result.setMonth(result.getMonth() + Number(months));
		}
		
		const years = context.getInputValue('years');
		if (years !== undefined) {
			result.setFullYear(result.getFullYear() + Number(years));
		}
		
		context.setOutputValue('out', result);
	}
};

/**
 * FormatDate node - converts a Date to a string
 * Supports different format types: 'iso', 'locale', 'date', 'time', 'timestamp'
 */
export const FormatDateNode: NodeDefinition = {
	type: 'FormatDate',
	category: 'datetime',
	description: 'Converts a Date to a formatted string',
	inputs: [
		{ name: 'date', type: 'Date' },
		{ name: 'format', type: 'string' }
	],
	outputs: [
		{ name: 'out', type: 'string' }
	],
	execute(context) {
		const date = context.getInputValue('date');
		const format = context.getInputValue('format') || 'iso';
		
		// Skip execution if date input is not available yet
		// The evaluator may call this node multiple times as inputs arrive
		// We only execute when the required date input is present
		if (date === undefined) {
			return;
		}
		
		if (!(date instanceof Date)) {
			throw new Error('FormatDate: date input must be a Date object');
		}
		
		let result: string;
		
		switch (format) {
			case 'iso':
				result = date.toISOString();
				break;
			case 'locale':
				result = date.toLocaleString();
				break;
			case 'date':
				result = date.toDateString();
				break;
			case 'time':
				result = date.toTimeString();
				break;
			case 'timestamp':
				result = date.getTime().toString();
				break;
			default:
				result = date.toISOString();
		}
		
		context.setOutputValue('out', result);
	}
};
