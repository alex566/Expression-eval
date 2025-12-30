/**
 * CEL Evaluator - Evaluates CEL expressions using @bufbuild/cel
 */

import { celEnv, parse, plan, run } from '@bufbuild/cel';
import type { Graph, EvaluationResult } from './types';
import { compileGraphToCEL } from './cel-compiler';

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
	 * Evaluate the graph with provided input data
	 */
	async evaluate(inputData: any = {}): Promise<EvaluationResult> {
		try {
			// Compile graph to CEL expression
			const celExpression = this.compile();
			
			console.log('CEL Expression:', celExpression);
			
			// Create CEL environment
			const env = celEnv({});
			
			// Parse the expression
			const parseResult = parse(env, celExpression);
			
			if (parseResult.issues && parseResult.issues.length > 0) {
				const errors = parseResult.issues.map((issue: any) => issue.message).join(', ');
				return {
					success: false,
					outputs: {},
					error: `CEL parse errors: ${errors}`
				};
			}
			
			// Plan the execution
			const planResult = plan(env, parseResult.ast);
			
			if (planResult.issues && planResult.issues.length > 0) {
				const errors = planResult.issues.map((issue: any) => issue.message).join(', ');
				return {
					success: false,
					outputs: {},
					error: `CEL plan errors: ${errors}`
				};
			}
			
			// Execute with input data
			const result = run(env, planResult.program, { input: inputData });
			
			return {
				success: true,
				outputs: { result },
				inferredTypes: undefined
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
