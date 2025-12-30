import type { NodeDefinition, TypeInferenceContext } from '../../dataflow/types';
import { unifyTypes } from '../../dataflow/type-inference';

/**
 * If node - conditional branching
 * Outputs either the true or false value based on condition
 * Can accept either a boolean value or a CEL expression that returns boolean
 */
export const IfNode: NodeDefinition = {
	type: 'If',
	category: 'control',
	description: 'Conditional execution based on a condition. Can accept boolean or expression.',
	inputs: [
		{ name: 'condition', type: 'boolean | string' }, // boolean or CEL expression
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

		// NOTE: In CEL mode, this execute method may not be used
		// If condition is a string (CEL expression), it will be compiled at graph level
		// This fallback evaluates based on the condition value
		if (typeof condition === 'boolean') {
			if (condition) {
				context.setOutputValue('out', trueValue);
			} else {
				context.setOutputValue('out', falseValue);
			}
		} else {
			// For string conditions in old execution path, treat as truthy
			// In CEL mode, the ternary operator would be used instead
			context.setOutputValue('out', condition ? trueValue : falseValue);
		}
	},
	inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
		// Output type is the unification of true and false branch types
		const trueType = context.getInputType('true');
		const falseType = context.getInputType('false');
		
		if (!trueType && !falseType) {
			return { out: 'any' };
		}
		
		if (!trueType) {
			return { out: falseType || 'any' };
		}
		
		if (!falseType) {
			return { out: trueType };
		}
		
		// Both branches have types - they should match or be unified
		const unifiedType = unifyTypes(trueType, falseType);
		return { out: unifiedType };
	}
};

/**
 * Switch node - multi-case branching based on a value
 * Routes input to different outputs based on the value matching a case
 */
export const SwitchNode: NodeDefinition = {
	type: 'Switch',
	category: 'control',
	description: 'Routes input to different outputs based on case matching',
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
