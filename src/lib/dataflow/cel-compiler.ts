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
			const sourceNode = graph.nodes.find(n => n.id === edge.from.node);
			const sourceExpression = nodeOutputs.get(edge.from.node) || 'null';
			
			// Special handling for Input node with property access
			if (sourceNode && sourceNode.type === 'Input' && edge.from.port !== 'out') {
				// If accessing a specific property from Input node, append property access
				return `input.${edge.from.port}`;
			}
			
			return sourceExpression;
		}
		return 'null';
	};
	
	switch (node.type) {
		case 'Input':
			// Input node provides access to the input data
			return 'input';
			
		case 'Expression': {
			// Expression node contains a CEL expression string with dynamic inputs
			// Replace references to inputs (in0, in1, etc.) with actual values
			let expression = node.data.expression || 'null';
			
			// Find all edges targeting this node
			const inputEdges = graph.edges.filter(e => e.to.node === node.id);
			
			// Build a map of input port names to their expressions
			const inputMap = new Map<string, string>();
			for (const edge of inputEdges) {
				const sourceExpression = nodeOutputs.get(edge.from.node) || 'null';
				const sourceNode = graph.nodes.find(n => n.id === edge.from.node);
				
				// Special handling for Input node with property access
				if (sourceNode && sourceNode.type === 'Input' && edge.from.port !== 'out') {
					inputMap.set(edge.to.port, `input.${edge.from.port}`);
				} else {
					inputMap.set(edge.to.port, sourceExpression);
				}
			}
			
			// Replace input references in the expression
			// Sort by key length descending to avoid partial replacements (e.g., in10 before in1)
			const sortedInputs = Array.from(inputMap.entries()).sort((a, b) => b[0].length - a[0].length);
			for (const [inputName, inputExpr] of sortedInputs) {
				// Use word boundary regex to ensure we replace whole identifiers
				const regex = new RegExp(`\\b${inputName}\\b`, 'g');
				expression = expression.replace(regex, `(${inputExpr})`);
			}
			
			return expression;
		}
			
		case 'CreateObject': {
			// CreateObject node creates an object from dynamic inputs
			const inputEdges = graph.edges.filter(e => e.to.node === node.id);
			const properties: string[] = [];
			
			for (const edge of inputEdges) {
				const sourceExpression = nodeOutputs.get(edge.from.node) || 'null';
				const propertyName = edge.to.port;
				properties.push(`"${propertyName}": ${sourceExpression}`);
			}
			
			return `{${properties.join(', ')}}`;
		}
			
		case 'If': {
			const condition = getInputExpression('condition');
			const trueVal = getInputExpression('true');
			const falseVal = getInputExpression('false');
			return `(${condition} ? ${trueVal} : ${falseVal})`;
		}
			
		case 'Map': {
			const array = getInputExpression('array');
			const exprInput = getInputExpression('expression');
			// If expression comes from an Expression node, it will be the expression string
			// CEL map: array.map(element, <expression>)
			return `${array}.map(element, ${exprInput})`;
		}
			
		case 'Filter': {
			const array = getInputExpression('array');
			const exprInput = getInputExpression('expression');
			// If expression comes from an Expression node, it will be the expression string
			// CEL filter: array.filter(element, <expression>)
			return `${array}.filter(element, ${exprInput})`;
		}
			
		case 'Reduce': {
			// Note: CEL doesn't have built-in reduce
			// This is a placeholder - proper implementation would need custom CEL functions
			// or use a different approach like fold operations
			const array = getInputExpression('array');
			const initial = getInputExpression('initial');
			const exprInput = getInputExpression('expression');
			// This will fail at runtime - needs custom implementation
			return `reduce(${array}, ${initial}, ${exprInput})`;
		}
		
		case 'CreateDate': {
			// Convert CreateDate node to createDate() CEL function call
			const value = getInputExpression('value');
			return `createDate(${value})`;
		}
		
		case 'AddDate': {
			// Convert AddDate node to addDays()/addHours() CEL function calls
			const date = getInputExpression('date');
			const days = getInputExpression('days');
			const hours = getInputExpression('hours');
			
			// Apply transformations in sequence
			let result = date;
			if (days !== 'null') {
				result = `addDays(${result}, ${days})`;
			}
			if (hours !== 'null') {
				result = `addHours(${result}, ${hours})`;
			}
			return result;
		}
		
		case 'FormatDate': {
			// Convert FormatDate node to formatDate() CEL function call
			const date = getInputExpression('date');
			const format = getInputExpression('format');
			return `formatDate(${date}, ${format})`;
		}
			
		case 'Output':
			// Output node just passes through its input
			return getInputExpression('result') || getInputExpression('in');
			
		default:
			// Unknown node type - log warning for debugging
			if (typeof console !== 'undefined' && console.warn) {
				console.warn(`Unknown node type during CEL compilation: ${node.type}`);
			}
			return 'null';
	}
}

/**
 * Topological sort of nodes to determine evaluation order
 * Returns nodes in dependency order (inputs before outputs)
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
	
	// Reverse the sorted array to get correct dependency order
	// DFS post-order visits nodes after their dependencies, adding them to the array
	// This creates a reverse topological order, so we reverse it to get dependency-first order
	// (inputs are processed before outputs)
	return sorted.reverse();
}
