import type { NodeDefinition, TypeInferenceContext } from '../../dataflow/types';

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
	},
	inferOutputTypes(context: TypeInferenceContext): Record<string, string> {
		// For CEL expressions, we could parse the expression to infer the type
		// For now, we return 'dyn' since CEL expressions can produce any type
		// A more sophisticated implementation would use CEL's type checker
		const expression = context.getNodeData().expression || '';
		
		// Simple heuristic-based type inference
		if (expression.includes('>') || expression.includes('<') || 
		    expression.includes('==') || expression.includes('!=') || 
		    expression.includes('&&') || expression.includes('||')) {
			// Likely a boolean expression
			return { out: 'bool' };
		}
		
		if (expression.includes('+') || expression.includes('-') || 
		    expression.includes('*') || expression.includes('/')) {
			// Check if inputs are numeric
			const in0Type = context.getInputType('in0');
			if (in0Type === 'int' || in0Type === 'double') {
				return { out: in0Type };
			}
			return { out: 'dyn' };
		}
		
		if (expression.includes('.map(') || expression.includes('.filter(')) {
			return { out: 'list(dyn)' };
		}
		
		// Default to dynamic type
		return { out: 'dyn' };
	}
};
