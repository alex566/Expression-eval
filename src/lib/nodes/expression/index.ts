import type { NodeDefinition, TypeInferenceContext } from '../../dataflow/types';

/**
 * Expression node - contains a JavaScript expression string with dynamic inputs
 * This node can accept multiple inputs via dynamic pins and evaluate expressions
 * Examples: "(in0 + 1) * 2", "in0 > 10 ? in1 : in2", "in0.date"
 * 
 * Features:
 * - Dynamic input pins (in0, in1, in2, ...) or custom named pins
 * - Expression preview shown in node UI
 * - Supports JavaScript syntax for property access (e.g., in0.date)
 */
export const ExpressionNode: NodeDefinition = {
	type: 'Expression',
	category: 'expression',
	description: 'JavaScript expression with dynamic inputs for inline processing. Example: "(in0 + 1) * 2"',
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
		// For JavaScript expressions, we use heuristic-based type inference
		const expression = context.getNodeData().expression || '';
		
		// Check for literal values first
		const trimmedExpr = expression.trim();
		
		// Number literal (e.g., "10", "42", "-5", "3.14")
		if (/^-?\d+(\.\d+)?$/.test(trimmedExpr)) {
			return { out: 'number' };
		}
		
		// String literal (e.g., '"hello"', "'world'", "`template`")
		if ((trimmedExpr.startsWith('"') && trimmedExpr.endsWith('"')) ||
		    (trimmedExpr.startsWith("'") && trimmedExpr.endsWith("'")) ||
		    (trimmedExpr.startsWith('`') && trimmedExpr.endsWith('`'))) {
			return { out: 'string' };
		}
		
		// Boolean literal
		if (trimmedExpr === 'true' || trimmedExpr === 'false') {
			return { out: 'boolean' };
		}
		
		// Array literal (e.g., "[1, 2, 3]")
		if (trimmedExpr.startsWith('[') && trimmedExpr.endsWith(']')) {
			return { out: 'unknown[]' };
		}
		
		// Object literal (e.g., "{a: 1, b: 2}")
		if (trimmedExpr.startsWith('{') && trimmedExpr.endsWith('}')) {
			return { out: 'object' };
		}
		
		// Simple heuristic-based type inference for expressions
		if (expression.includes('>') || expression.includes('<') || 
		    expression.includes('==') || expression.includes('===') ||
		    expression.includes('!=') || expression.includes('!==') ||
		    expression.includes('&&') || expression.includes('||')) {
			// Likely a boolean expression
			return { out: 'boolean' };
		}
		
		if (expression.includes('+') || expression.includes('-') || 
		    expression.includes('*') || expression.includes('/')) {
			// JavaScript keywords and functions to skip during variable extraction
			const jsKeywords = ['true', 'false', 'null', 'undefined', 'in', 'of', 'typeof'];
			
			// Extract variable names from the expression to check their types
			const variablePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
			const matches = expression.matchAll(variablePattern);
			const variableNames = new Set<string>();
			
			for (const match of matches) {
				const varName = match[1];
				// Skip JavaScript keywords and functions
				if (!jsKeywords.includes(varName)) {
					variableNames.add(varName);
				}
			}
			
			// Also check for standard in0, in1, in2, etc. inputs (up to in9)
			for (let i = 0; i < 10; i++) {
				variableNames.add(`in${i}`);
			}
			
			// Collect types for all variables
			const inputTypes: string[] = [];
			for (const varName of variableNames) {
				const inputType = context.getInputType(varName);
				if (inputType && inputType !== 'any') {
					inputTypes.push(inputType);
				}
			}
			
			// If we found any input types, use them for inference
			if (inputTypes.length > 0) {
				// If all inputs are numbers, result is number
				if (inputTypes.every(t => t === 'number')) {
					return { out: 'number' };
				}
				// If we have string concatenation with +
				if (expression.includes('+') && inputTypes.some(t => t === 'string')) {
					return { out: 'string' };
				}
			}
			
			return { out: 'any' };
		}
		
		if (expression.includes('.map(') || expression.includes('.filter(')) {
			return { out: 'unknown[]' };
		}
		
		// Default to any type
		return { out: 'any' };
	}
};
