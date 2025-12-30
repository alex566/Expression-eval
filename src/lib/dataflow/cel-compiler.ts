/**
 * CEL Compiler - Converts graph nodes to CEL expressions
 */

import type { Graph, GraphNode, GraphEdge } from './types';

/**
 * Compile a graph to a CEL expression
 */
export function compileGraphToCEL(graph: Graph): string {
	// Build a map of node outputs
	const nodeOutputs = new Map<string, string>();
	
	// Find all nodes that need to be compiled
	const sortedNodes = topologicalSort(graph);
	
	// Compile each node to a CEL expression
	for (const node of sortedNodes) {
		const celExpr = compileNodeToCEL(node, graph, nodeOutputs);
		nodeOutputs.set(node.id, celExpr);
	}
	
	// Find the output node and return its expression
	const outputNode = graph.nodes.find(n => n.type === 'Output');
	if (outputNode) {
		// Get the input to the output node
		const outputEdge = graph.edges.find(e => e.to.node === outputNode.id);
		if (outputEdge) {
			return nodeOutputs.get(outputEdge.from.node) || 'null';
		}
	}
	
	// If no output node, return the last node's expression
	if (sortedNodes.length > 0) {
		return nodeOutputs.get(sortedNodes[sortedNodes.length - 1].id) || 'null';
	}
	
	return 'null';
}

/**
 * Compile a single node to CEL expression
 */
function compileNodeToCEL(
	node: GraphNode,
	graph: Graph,
	nodeOutputs: Map<string, string>
): string {
	// Get input values for this node
	const getInputExpression = (portName: string): string => {
		const edge = graph.edges.find(e => e.to.node === node.id && e.to.port === portName);
		if (edge) {
			return nodeOutputs.get(edge.from.node) || 'null';
		}
		return 'null';
	};
	
	switch (node.type) {
		case 'Value':
			return JSON.stringify(node.data.value);
			
		case 'Input':
			// Input node provides access to the input data
			return 'input';
			
		case 'Expression':
			// Expression node contains a CEL expression string
			// Replace references to connected inputs
			let expr = node.data.expression || 'null';
			// Simple placeholder replacement (can be enhanced)
			return expr;
			
		case 'Add':
			return `(${getInputExpression('in0')} + ${getInputExpression('in1')})`;
			
		case 'Subtract':
			return `(${getInputExpression('in0')} - ${getInputExpression('in1')})`;
			
		case 'Multiply':
			return `(${getInputExpression('in0')} * ${getInputExpression('in1')})`;
			
		case 'Divide':
			return `(${getInputExpression('in0')} / ${getInputExpression('in1')})`;
			
		case 'Modulo':
			return `(${getInputExpression('in0')} % ${getInputExpression('in1')})`;
			
		case 'Compare': {
			const operator = node.data.operator || '==';
			const a = getInputExpression('a');
			const b = getInputExpression('b');
			return `(${a} ${operator} ${b})`;
		}
			
		case 'If': {
			const condition = getInputExpression('condition');
			const trueVal = getInputExpression('true');
			const falseVal = getInputExpression('false');
			return `(${condition} ? ${trueVal} : ${falseVal})`;
		}
			
		case 'Map': {
			const array = getInputExpression('array');
			const exprNode = getInputExpression('expression');
			// CEL map: array.map(x, <expression>)
			return `${array}.map(element, ${exprNode})`;
		}
			
		case 'Filter': {
			const array = getInputExpression('array');
			const exprNode = getInputExpression('expression');
			// CEL filter: array.filter(x, <expression>)
			return `${array}.filter(element, ${exprNode})`;
		}
			
		case 'Reduce': {
			// CEL doesn't have built-in reduce, we'd need to implement or use fold
			// For simplicity, compile to a function call
			const array = getInputExpression('array');
			const initial = getInputExpression('initial');
			const exprNode = getInputExpression('expression');
			// This is a simplified version - real implementation would need custom CEL functions
			return `reduce(${array}, ${initial}, ${exprNode})`;
		}
			
		case 'Output':
			// Output node just passes through its input
			return getInputExpression('result') || getInputExpression('in');
			
		default:
			// Unknown node type
			console.warn(`Unknown node type: ${node.type}`);
			return 'null';
	}
}

/**
 * Topological sort of nodes to determine evaluation order
 */
function topologicalSort(graph: Graph): GraphNode[] {
	const sorted: GraphNode[] = [];
	const visited = new Set<string>();
	const visiting = new Set<string>();
	
	// Build adjacency map
	const adjacency = new Map<string, string[]>();
	for (const node of graph.nodes) {
		adjacency.set(node.id, []);
	}
	for (const edge of graph.edges) {
		const neighbors = adjacency.get(edge.from.node) || [];
		neighbors.push(edge.to.node);
		adjacency.set(edge.from.node, neighbors);
	}
	
	// DFS visit
	const visit = (nodeId: string): void => {
		if (visited.has(nodeId)) return;
		if (visiting.has(nodeId)) {
			throw new Error(`Cycle detected in graph at node: ${nodeId}`);
		}
		
		visiting.add(nodeId);
		
		const neighbors = adjacency.get(nodeId) || [];
		for (const neighbor of neighbors) {
			visit(neighbor);
		}
		
		visiting.delete(nodeId);
		visited.add(nodeId);
		
		const node = graph.nodes.find(n => n.id === nodeId);
		if (node) {
			sorted.push(node);
		}
	};
	
	// Visit all nodes
	for (const node of graph.nodes) {
		visit(node.id);
	}
	
	return sorted;
}
