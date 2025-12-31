/**
 * CEL Evaluator - Evaluates CEL expressions using @bufbuild/cel
 */

import { celEnv, parse, plan } from '@bufbuild/cel';
import type { Graph, EvaluationResult, TypeCheckResult } from './types';
import { compileGraphToCEL, compileNodeExpressions } from './cel-compiler';
import { createDateFunctions } from './cel-date-functions';
import { inferGraphTypes } from './type-inference';

/**
 * Convert CEL Map objects to plain JavaScript objects for JSON serialization
 */
function convertCELToJS(value: any): any {
	// Handle null and undefined
	if (value === null || value === undefined) {
		return value;
	}
	
	// Handle BigInt
	if (typeof value === 'bigint') {
		return Number(value);
	}
	
	// Handle CEL Map objects (from @bufbuild/cel)
	if (value && typeof value === 'object' && '_map' in value) {
		const result: Record<string, any> = {};
		const map = value._map;
		if (map && typeof map.forEach === 'function') {
			map.forEach((v: any, k: any) => {
				result[String(k)] = convertCELToJS(v);
			});
		}
		return result;
	}
	
	// Handle arrays
	if (Array.isArray(value)) {
		return value.map(convertCELToJS);
	}
	
	// Handle plain objects
	if (typeof value === 'object' && value.constructor === Object) {
		const result: Record<string, any> = {};
		for (const [k, v] of Object.entries(value)) {
			result[k] = convertCELToJS(v);
		}
		return result;
	}
	
	// Handle primitives and other types
	return value;
}

/**
 * CEL-based graph evaluator
 */
export class CELGraphEvaluator {
	constructor(private graph: Graph) {}
	
	/**
	 * Compile the graph to a CEL expression
	 */
	compile(): string {
		return compileGraphToCEL(this.graph);
	}
	
	/**
	 * Perform type checking on the graph
	 * Returns type information for all nodes and any errors/warnings
	 */
	typeCheck(): TypeCheckResult {
		return inferGraphTypes(this.graph);
	}
	
	/**
	 * Evaluate the graph with provided input data
	 */
	async evaluate(inputData: any = {}): Promise<EvaluationResult> {
		try {
			// Compile graph to CEL expression
			const celExpression = this.compile();
			
			// Create CEL environment with custom date functions
			const env = celEnv({
				funcs: createDateFunctions()
			});
			
			// Parse the expression
			const parsedExpr = parse(celExpression);
			
			// Plan the execution
			const evaluationFn = plan(env, parsedExpr);
			
			// Execute with input data
			const result = evaluationFn({ input: inputData });
			
			// Check if result is an error
			if (result && typeof result === 'object' && 'error' in result) {
				return {
					success: false,
					outputs: {},
					error: `CEL evaluation error: ${(result as any).error}`
				};
			}
			
			// Compile and evaluate individual node expressions
			const nodeValues = new Map<string, any>();
			const nodeExpressions = compileNodeExpressions(this.graph);
			
			for (const [nodeId, nodeExpr] of nodeExpressions) {
				try {
					// Skip Output nodes as they don't have meaningful values
					const node = this.graph.nodes.find(n => n.id === nodeId);
					if (node && node.type === 'Output') {
						continue;
					}
					
					const parsedNodeExpr = parse(nodeExpr);
					const nodeEvalFn = plan(env, parsedNodeExpr);
					const nodeResult = nodeEvalFn({ input: inputData });
					
					// Check if node result is an error
					if (nodeResult && typeof nodeResult === 'object' && 'error' in nodeResult) {
						// Skip nodes with errors - they might depend on missing data
						continue;
					}
					
					nodeValues.set(nodeId, convertCELToJS(nodeResult));
				} catch (err) {
					// Skip nodes that fail to evaluate - they might have issues
					console.warn(`Failed to evaluate node ${nodeId}:`, err);
				}
			}
			
			return {
				success: true,
				outputs: { result: convertCELToJS(result) },
				nodeValues
			};
		} catch (error) {
			return {
				success: false,
				outputs: {},
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}
}
