/**
 * Test script to verify QuickJS evaluator functionality
 */

import { QuickJSGraphEvaluator } from './src/lib/dataflow/quickjs-evaluator.ts';
import { registerAllNodes } from './src/lib/nodes/index.ts';
import type { Graph } from './src/lib/dataflow/types.ts';

// Register all node types first
registerAllNodes();

// Test 1: Simple expression
console.log('=== Test 1: Simple Expression ===');
const simpleGraph: Graph = {
	nodes: [
		{ id: 'input1', type: 'Input', data: {} },
		{ id: 'expr1', type: 'Expression', data: { expression: 'in0 + 10' } },
		{ id: 'output1', type: 'Output', data: {} }
	],
	edges: [
		{ from: { node: 'input1', port: 'value' }, to: { node: 'expr1', port: 'in0' } },
		{ from: { node: 'expr1', port: 'out' }, to: { node: 'output1', port: 'in' } }
	]
};

const evaluator1 = new QuickJSGraphEvaluator(simpleGraph);
console.log('Compiled JavaScript:');
console.log(evaluator1.compile());
console.log();

const result1 = await evaluator1.evaluate({ value: 5 });
console.log('Input: { value: 5 }');
console.log('Result:', result1);
console.log();

// Test 2: Conditional (If node)
console.log('=== Test 2: Conditional (If node) ===');
const conditionalGraph: Graph = {
	nodes: [
		{ id: 'input1', type: 'Input', data: {} },
		{ id: 'cond', type: 'Expression', data: { expression: 'in0 > 10' } },
		{ id: 'true_val', type: 'Expression', data: { expression: '"High"' } },
		{ id: 'false_val', type: 'Expression', data: { expression: '"Low"' } },
		{ id: 'if1', type: 'If', data: {} },
		{ id: 'output1', type: 'Output', data: {} }
	],
	edges: [
		{ from: { node: 'input1', port: 'value' }, to: { node: 'cond', port: 'in0' } },
		{ from: { node: 'cond', port: 'out' }, to: { node: 'if1', port: 'condition' } },
		{ from: { node: 'true_val', port: 'out' }, to: { node: 'if1', port: 'true' } },
		{ from: { node: 'false_val', port: 'out' }, to: { node: 'if1', port: 'false' } },
		{ from: { node: 'if1', port: 'out' }, to: { node: 'output1', port: 'result' } }
	]
};

const evaluator2 = new QuickJSGraphEvaluator(conditionalGraph);
console.log('Compiled JavaScript:');
console.log(evaluator2.compile());
console.log();

const result2a = await evaluator2.evaluate({ value: 15 });
console.log('Input: { value: 15 }');
console.log('Result:', result2a);
console.log();

const result2b = await evaluator2.evaluate({ value: 5 });
console.log('Input: { value: 5 }');
console.log('Result:', result2b);
console.log();

// Test 3: Create Object
console.log('=== Test 3: Create Object ===');
const objectGraph: Graph = {
	nodes: [
		{ id: 'name', type: 'Expression', data: { expression: '"John Doe"' } },
		{ id: 'age', type: 'Expression', data: { expression: '30' } },
		{ id: 'obj1', type: 'CreateObject', data: {} },
		{ id: 'output1', type: 'Output', data: {} }
	],
	edges: [
		{ from: { node: 'name', port: 'out' }, to: { node: 'obj1', port: 'name' } },
		{ from: { node: 'age', port: 'out' }, to: { node: 'obj1', port: 'age' } },
		{ from: { node: 'obj1', port: 'out' }, to: { node: 'output1', port: 'result' } }
	]
};

const evaluator3 = new QuickJSGraphEvaluator(objectGraph);
console.log('Compiled JavaScript:');
console.log(evaluator3.compile());
console.log();

const result3 = await evaluator3.evaluate({});
console.log('Input: {}');
console.log('Result:', result3);
console.log();

// Test 4: Type checking
console.log('=== Test 4: Type Checking ===');
const typeCheck1 = evaluator1.typeCheck();
console.log('Simple Expression - Type Check Result:');
console.log('Valid:', typeCheck1.valid);
console.log('Errors:', typeCheck1.errors);
console.log('Warnings:', typeCheck1.warnings);
console.log();

console.log('All tests completed!');
