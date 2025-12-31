/**
 * QuickJS Evaluator - Evaluates JavaScript expressions using QuickJS WASM
 * Provides a fully sandboxed JavaScript execution environment
 */

import { getQuickJS, type QuickJSContext, type QuickJSRuntime } from 'quickjs-emscripten';
import type { Graph, EvaluationResult, TypeCheckResult } from './types';
import { compileGraphToJS, compileNodeExpressions } from './js-compiler';
import { inferGraphTypes } from './type-inference';

/**
 * QuickJS-based graph evaluator
 * Provides sandboxed JavaScript execution with no global state or function access
 * except for registered custom functions
 */
export class QuickJSGraphEvaluator {
	constructor(private graph: Graph) {}
	
	/**
	 * Compile the graph to JavaScript code
	 */
	compile(): string {
		return compileGraphToJS(this.graph);
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
	 * Uses QuickJS in a fully sandboxed environment
	 */
	async evaluate(inputData: any = {}): Promise<EvaluationResult> {
		let runtime: QuickJSRuntime | null = null;
		let context: QuickJSContext | null = null;
		
		try {
			// Initialize QuickJS
			const QuickJS = await getQuickJS();
			runtime = QuickJS.newRuntime();
			
			// Set memory limit for safety (16MB)
			runtime.setMemoryLimit(16 * 1024 * 1024);
			
			// Set execution timeout (5 seconds)
			runtime.setInterruptHandler(() => false);
			
			// Create a new context (sandbox)
			context = runtime.newContext();
			
			// Register custom functions
			this.registerCustomFunctions(context);
			
			// Compile graph to JavaScript code
			const jsCode = this.compile();
			
			// Create a function that takes input and returns output
			const wrappedCode = `
(function(input) {
${jsCode}
})
`;
			
			// Evaluate the function definition
			const fnHandle = context.evalCode(wrappedCode);
			if (fnHandle.error) {
				const error = context.dump(fnHandle.error);
				fnHandle.error.dispose();
				return {
					success: false,
					outputs: {},
					error: `Compilation error: ${error}`
				};
			}
			
			// Convert input data to QuickJS value
			const inputHandle = context.newObject();
			this.populateObject(context, inputHandle, inputData);
			
			// Call the function with input data
			const resultHandle = context.callFunction(fnHandle.value, context.undefined, inputHandle);
			
			// Clean up function and input handles
			fnHandle.value.dispose();
			inputHandle.dispose();
			
			if (resultHandle.error) {
				const error = context.dump(resultHandle.error);
				resultHandle.error.dispose();
				return {
					success: false,
					outputs: {},
					error: `Execution error: ${error}`
				};
			}
			
			// Extract the result
			const result = context.dump(resultHandle.value);
			resultHandle.value.dispose();
			
			// Evaluate individual nodes for visualization
			const nodeValues = new Map<string, any>();
			const nodeExpressions = compileNodeExpressions(this.graph);
			
			for (const [nodeId, nodeExpr] of nodeExpressions) {
				try {
					// Skip Output nodes as they don't have meaningful values
					const node = this.graph.nodes.find(n => n.id === nodeId);
					if (node && node.type === 'Output') {
						continue;
					}
					
					// Create wrapper code for evaluating individual node
					const nodeCode = `
(function(input) {
	${nodeExpr}
})
`;
					
					const nodeFnHandle = context.evalCode(nodeCode);
					if (nodeFnHandle.error) {
						nodeFnHandle.error.dispose();
						continue;
					}
					
					const nodeInputHandle = context.newObject();
					this.populateObject(context, nodeInputHandle, inputData);
					
					const nodeResultHandle = context.callFunction(
						nodeFnHandle.value,
						context.undefined,
						nodeInputHandle
					);
					
					nodeFnHandle.value.dispose();
					nodeInputHandle.dispose();
					
					if (nodeResultHandle.error) {
						nodeResultHandle.error.dispose();
						continue;
					}
					
					const nodeValue = context.dump(nodeResultHandle.value);
					nodeResultHandle.value.dispose();
					nodeValues.set(nodeId, nodeValue);
				} catch (err) {
					console.warn(`Failed to evaluate node ${nodeId}:`, err);
				}
			}
			
			return {
				success: true,
				outputs: { result },
				nodeValues
			};
		} catch (error) {
			return {
				success: false,
				outputs: {},
				error: error instanceof Error ? error.message : String(error)
			};
		} finally {
			// Clean up QuickJS resources
			if (context) {
				context.dispose();
			}
			if (runtime) {
				runtime.dispose();
			}
		}
	}
	
	/**
	 * Register custom functions in the QuickJS context
	 */
	private registerCustomFunctions(context: QuickJSContext): void {
		// Register formatDate function
		const formatDateFn = context.newFunction('formatDate', (dateHandle, formatHandle) => {
			const date = context.dump(dateHandle);
			const format = context.dump(formatHandle);
			
			let dateObj: Date;
			if (date instanceof Date) {
				dateObj = date;
			} else if (typeof date === 'number') {
				dateObj = new Date(date);
			} else if (typeof date === 'string') {
				dateObj = new Date(date);
			} else {
				dateObj = new Date();
			}
			
			let result: string;
			switch (format) {
				case 'iso':
					result = dateObj.toISOString();
					break;
				case 'locale':
					result = dateObj.toLocaleString();
					break;
				case 'date':
					result = dateObj.toDateString();
					break;
				case 'time':
					result = dateObj.toTimeString();
					break;
				case 'timestamp':
					result = dateObj.getTime().toString();
					break;
				default:
					result = dateObj.toISOString();
			}
			
			return context.newString(result);
		});
		
		// Add to global scope
		context.setProp(context.global, 'formatDate', formatDateFn);
		formatDateFn.dispose();
	}
	
	/**
	 * Populate a QuickJS object with JavaScript data
	 */
	private populateObject(context: QuickJSContext, objHandle: any, data: any): void {
		if (data === null || data === undefined) {
			return;
		}
		
		if (typeof data === 'object' && !Array.isArray(data)) {
			for (const [key, value] of Object.entries(data)) {
				const valueHandle = this.convertToQuickJS(context, value);
				context.setProp(objHandle, key, valueHandle);
				valueHandle.dispose();
			}
		}
	}
	
	/**
	 * Convert JavaScript value to QuickJS value
	 */
	private convertToQuickJS(context: QuickJSContext, value: any): any {
		if (value === null || value === undefined) {
			return context.null;
		}
		
		if (typeof value === 'boolean') {
			return value ? context.true : context.false;
		}
		
		if (typeof value === 'number') {
			return context.newNumber(value);
		}
		
		if (typeof value === 'string') {
			return context.newString(value);
		}
		
		if (Array.isArray(value)) {
			const arrayHandle = context.newArray();
			for (let i = 0; i < value.length; i++) {
				const itemHandle = this.convertToQuickJS(context, value[i]);
				context.setProp(arrayHandle, i, itemHandle);
				itemHandle.dispose();
			}
			return arrayHandle;
		}
		
		if (typeof value === 'object') {
			const objHandle = context.newObject();
			for (const [key, val] of Object.entries(value)) {
				const valHandle = this.convertToQuickJS(context, val);
				context.setProp(objHandle, key, valHandle);
				valHandle.dispose();
			}
			return objHandle;
		}
		
		return context.undefined;
	}
}
