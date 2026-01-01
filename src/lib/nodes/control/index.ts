import type { NodeDefinition } from '../../dataflow/types';

/**
 * If node - conditional branching
 * Outputs either the true or false value based on condition
 * Can accept either a boolean value or a JavaScript expression that returns boolean
 * 
 * Type inference is now handled by TypeScript factory API (ternary operator)
 */
export const IfNode: NodeDefinition = {
	type: 'If',
	category: 'control',
	description: 'Conditional execution based on a condition. Can accept boolean or expression.',
	inputs: [
		{ name: 'condition', type: 'boolean | string' }, // boolean or expression
		{ name: 'true', type: 'any' },
		{ name: 'false', type: 'any' }
	],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	execute(context) {
		const condition = context.getInputValue('condition');
		const trueValue = context.getInputValue('true');
		const falseValue = context.getInputValue('false');

		if (Array.isArray(condition)) {
			throw new Error('If node does not support array conditions.');
		}

		// NOTE: In JavaScript mode, this execute method may not be used
		// If condition is a string (expression), it will be compiled at graph level
		// This fallback evaluates based on the condition value
		if (typeof condition === 'boolean') {
			if (condition) {
				context.setOutputValue('out', trueValue);
			} else {
				context.setOutputValue('out', falseValue);
			}
		} else {
			// For string conditions in old execution path, treat as truthy
			// In JavaScript mode, the ternary operator would be used instead
			context.setOutputValue('out', condition ? trueValue : falseValue);
		}
	}
	// inferOutputTypes removed - TypeScript factory API handles type unification automatically
};

/**
 * Match node - pattern matching with multiple values per case
 * Inspired by JavaScript switch statements and functional programming patterns
 * 
 * Features:
 * - Multiple values can map to the same output branch
 * - Automatic break after matching case (no fallthrough)
 * - Default case for unmatched values
 * - Cases defined as: { "case1": ["value1", "value2"], "case2": ["value3"] }
 * 
 * Type inference handled by TypeScript factory API
 */
export const MatchNode: NodeDefinition = {
	type: 'Match',
	category: 'control',
	description: 'Pattern matching - routes input to outputs based on case values',
	inputs: [
		{ name: 'value', type: 'any' }
		// Dynamic inputs for each case (warm, cool, etc.) and default
	],
	outputs: [
		{ name: 'out', type: 'any' }
	],
	execute(context) {
		const value = context.getInputValue('value');
		const cases = context.getNodeData().cases || {};
		
		// Check if value matches any case
		// cases format: { "caseName": ["value1", "value2", ...] }
		let result = null;
		let matched = false;
		
		for (const [caseName, caseValues] of Object.entries(cases)) {
			const values = Array.isArray(caseValues) ? caseValues : [caseValues];
			
			// Check if input value matches any of the case values
			for (const caseValue of values) {
				if (String(value) === String(caseValue)) {
					result = context.getInputValue(caseName);
					matched = true;
					break;
				}
			}
			
			if (matched) break; // No fallthrough
		}

		// If no match, use default
		if (!matched) {
			result = context.getInputValue('default');
		}
		
		context.setOutputValue('out', result);
	}
};

/**
 * @deprecated Use MatchNode instead. Kept for backward compatibility.
 */
export const SwitchNode: NodeDefinition = {
	type: 'Switch',
	category: 'control',
	description: '[DEPRECATED] Use Match node instead',
	inputs: [
		{ name: 'value', type: 'any' }
	],
	outputs: [
		{ name: 'default', type: 'any' }
	],
	execute(context) {
		const value = context.getInputValue('value');
		const cases = context.getNodeData().cases || {};
		
		// Check if value matches any case
		let matched = false;
		for (const [caseValue, outputPort] of Object.entries(cases)) {
			if (String(value) === String(caseValue)) {
				context.setOutputValue(outputPort as string, value);
				matched = true;
				break;
			}
		}

		// If no match, output to default
		if (!matched) {
			context.setOutputValue('default', value);
		}
	}
};
