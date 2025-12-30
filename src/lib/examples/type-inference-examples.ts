/**
 * Example demonstrating type inference for CEL expressions
 * 
 * This file shows how the type inference system works with various node types
 */

import type { Graph } from '../dataflow/types';
import { CELGraphEvaluator } from '../dataflow/cel-evaluator';

// Example 1: If node type inference
// The If node should infer its output type from true/false branches
export const ifNodeExample: Graph = {
	nodes: [
		{ id: 'input1', type: 'Input', data: {} },
		{ id: 'cond', type: 'Expression', data: { expression: 'in0 > 5' } },
		{ id: 'true_val', type: 'Expression', data: { expression: '100' } },
		{ id: 'false_val', type: 'Expression', data: { expression: '0' } },
		{ id: 'if1', type: 'If', data: {} },
		{ id: 'output1', type: 'Output', data: {} }
	],
	edges: [
		{ from: { node: 'input1', port: 'out' }, to: { node: 'cond', port: 'in0' } },
		{ from: { node: 'cond', port: 'out' }, to: { node: 'if1', port: 'condition' } },
		{ from: { node: 'true_val', port: 'out' }, to: { node: 'if1', port: 'true' } },
		{ from: { node: 'false_val', port: 'out' }, to: { node: 'if1', port: 'false' } },
		{ from: { node: 'if1', port: 'out' }, to: { node: 'output1', port: 'result' } }
	]
};

// Example 2: Map node type inference
// The Map node should preserve array types
export const mapNodeExample: Graph = {
	nodes: [
		{ id: 'input1', type: 'Input', data: {} },
		{ id: 'expr1', type: 'Expression', data: { expression: 'element * 2' } },
		{ id: 'map1', type: 'Map', data: {} },
		{ id: 'output1', type: 'Output', data: {} }
	],
	edges: [
		{ from: { node: 'input1', port: 'out' }, to: { node: 'map1', port: 'array' } },
		{ from: { node: 'expr1', port: 'out' }, to: { node: 'map1', port: 'expression' } },
		{ from: { node: 'map1', port: 'out' }, to: { node: 'output1', port: 'result' } }
	]
};

// Example 3: CreateObject node type inference
// The CreateObject node should infer object structure from inputs
export const createObjectExample: Graph = {
	nodes: [
		{ id: 'name', type: 'Expression', data: { expression: '"John"' } },
		{ id: 'age', type: 'Expression', data: { expression: '30' } },
		{ id: 'obj1', type: 'CreateObject', data: { pinNames: ['name', 'age'] } },
		{ id: 'output1', type: 'Output', data: {} }
	],
	edges: [
		{ from: { node: 'name', port: 'out' }, to: { node: 'obj1', port: 'name' } },
		{ from: { node: 'age', port: 'out' }, to: { node: 'obj1', port: 'age' } },
		{ from: { node: 'obj1', port: 'out' }, to: { node: 'output1', port: 'result' } }
	]
};

/**
 * Run type inference on example graphs
 */
export function runTypeInferenceExamples() {
	console.log('=== Type Inference Examples ===\n');
	
	// Example 1: If node
	console.log('Example 1: If Node Type Inference');
	const evaluator1 = new CELGraphEvaluator(ifNodeExample);
	const typeCheck1 = evaluator1.typeCheck();
	console.log('Valid:', typeCheck1.valid);
	console.log('Errors:', typeCheck1.errors);
	console.log('Warnings:', typeCheck1.warnings);
	console.log('Node Types:');
	typeCheck1.nodeTypes.forEach((info, nodeId) => {
		console.log(`  ${nodeId} (${info.nodeType}):`);
		console.log(`    Input Types:`, info.inputTypes);
		console.log(`    Output Types:`, info.outputTypes);
		if (info.errors.length > 0) {
			console.log(`    Errors:`, info.errors);
		}
	});
	console.log();
	
	// Example 2: Map node
	console.log('Example 2: Map Node Type Inference');
	const evaluator2 = new CELGraphEvaluator(mapNodeExample);
	const typeCheck2 = evaluator2.typeCheck();
	console.log('Valid:', typeCheck2.valid);
	console.log('Errors:', typeCheck2.errors);
	console.log('Warnings:', typeCheck2.warnings);
	console.log('Node Types:');
	typeCheck2.nodeTypes.forEach((info, nodeId) => {
		console.log(`  ${nodeId} (${info.nodeType}):`);
		console.log(`    Input Types:`, info.inputTypes);
		console.log(`    Output Types:`, info.outputTypes);
	});
	console.log();
	
	// Example 3: CreateObject node
	console.log('Example 3: CreateObject Node Type Inference');
	const evaluator3 = new CELGraphEvaluator(createObjectExample);
	const typeCheck3 = evaluator3.typeCheck();
	console.log('Valid:', typeCheck3.valid);
	console.log('Errors:', typeCheck3.errors);
	console.log('Warnings:', typeCheck3.warnings);
	console.log('Node Types:');
	typeCheck3.nodeTypes.forEach((info, nodeId) => {
		console.log(`  ${nodeId} (${info.nodeType}):`);
		console.log(`    Input Types:`, info.inputTypes);
		console.log(`    Output Types:`, info.outputTypes);
	});
	console.log();
}

// Export for use in application
export { ifNodeExample, mapNodeExample, createObjectExample };
