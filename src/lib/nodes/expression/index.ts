import type { NodeDefinition } from '../../dataflow/types';

/**
 * Expression node - contains a CEL expression string with dynamic inputs
 * This node can accept multiple inputs via dynamic pins and evaluate expressions
 * Examples: "(in0 + 1) * 2", "in0 > 10 ? in1 : in2", "in0.date"
 * 
 * Features:
 * - Dynamic input pins (in0, in1, in2, ...) or custom named pins
 * - Expression preview shown in node UI
 * - Supports CEL syntax for property access (e.g., in0.date)
 */
export const ExpressionNode: NodeDefinition = {
	type: 'Expression',
	category: 'expression',
	description: 'CEL expression with dynamic inputs for inline processing. Example: "(in0 + 1) * 2"',
	inputs: [], // Dynamic inputs - will accept in0, in1, in2, etc. or custom names
	outputs: [
		{ name: 'out', type: 'any' }
	],
	execute(context) {
		// Expression nodes are compiled at graph compilation time
		// They don't execute in the traditional sense
		const expression = context.getNodeData().expression || '';
		context.setOutputValue('out', expression);
	}
};
