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
		// For now, we use heuristic-based type inference
		const expression = context.getNodeData().expression || '';
		
		// Check for literal values first
		const trimmedExpr = expression.trim();
		
		// Integer literal (e.g., "10", "42", "-5")
		if (/^-?\d+$/.test(trimmedExpr)) {
			return { out: 'int' };
		}
		
		// Double literal (e.g., "3.14", "-2.5")
		if (/^-?\d+\.\d+$/.test(trimmedExpr)) {
			return { out: 'double' };
		}
		
		// String literal (e.g., '"hello"', "'world'")
		if ((trimmedExpr.startsWith('"') && trimmedExpr.endsWith('"')) ||
		    (trimmedExpr.startsWith("'") && trimmedExpr.endsWith("'"))) {
			return { out: 'string' };
		}
		
		// Boolean literal
		if (trimmedExpr === 'true' || trimmedExpr === 'false') {
			return { out: 'bool' };
		}
		
		// List literal (e.g., "[1, 2, 3]")
		if (trimmedExpr.startsWith('[') && trimmedExpr.endsWith(']')) {
			return { out: 'list(dyn)' };
		}
		
		// Map/Object literal (e.g., "{a: 1, b: 2}")
		if (trimmedExpr.startsWith('{') && trimmedExpr.endsWith('}')) {
			return { out: 'map(string, dyn)' };
		}
		
		// Simple heuristic-based type inference for expressions
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
			const in1Type = context.getInputType('in1');
			
			// If both inputs are integers, result is integer
			if (in0Type === 'int' && in1Type === 'int') {
				return { out: 'int' };
			}
			
			// If any input is double or if we have a numeric operation, return double
			if (in0Type === 'int' || in0Type === 'double' || 
			    in1Type === 'int' || in1Type === 'double') {
				return { out: 'double' };
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
