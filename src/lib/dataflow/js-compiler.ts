/**
 * JavaScript Code Generator - Converts graph nodes to JavaScript code
 * Replaces the CEL compiler with JavaScript code generation for QuickJS evaluation
 */

import type { Graph, GraphNode, GraphEdge } from './types';

/**
 * Compile a graph to JavaScript code
 * Each node's result is stored in a const variable named node_<id>
 * This allows results to be reused by multiple downstream nodes
 */
export function compileGraphToJS(graph: Graph): string {
	// Build a map of node outputs to variable names
	const nodeVars = new Map<string, string>();
	
	// Find all nodes that need to be compiled
	const sortedNodes = topologicalSort(graph);
	
	// Generate code for each node
	const statements: string[] = [];
	
	for (const node of sortedNodes) {
		const varName = `node_${node.id}`;
		const jsExpr = compileNodeToJS(node, graph, nodeVars);
		statements.push(`const ${varName} = ${jsExpr};`);
		nodeVars.set(node.id, varName);
	}
	
	// Find the output node and return its value
	const outputNode = graph.nodes.find(n => n.type === 'Output');
	if (outputNode) {
		// Get all edges to the output node
		const outputEdges = graph.edges.filter(e => e.to.node === outputNode.id);
		if (outputEdges.length > 0) {
			// If there are multiple outputs, create an object with named properties
			if (outputEdges.length > 1) {
				const properties: string[] = [];
				for (const edge of outputEdges) {
					const sourceVar = nodeVars.get(edge.from.node) || 'null';
					const outputName = edge.to.port;
					properties.push(`"${outputName}": ${sourceVar}`);
				}
				statements.push(`return {${properties.join(', ')}};`);
			} else {
				// Single output
				const edge = outputEdges[0];
				const sourceVar = nodeVars.get(edge.from.node) || 'null';
				const outputName = edge.to.port;
				
				// If the output has a specific name (not just 'result' or 'in'), create an object
				if (outputName && outputName !== 'in') {
					statements.push(`return {"${outputName}": ${sourceVar}};`);
				} else {
					// Legacy behavior for unnamed outputs
					statements.push(`return ${sourceVar};`);
				}
			}
		}
	} else if (sortedNodes.length > 0) {
		// If no output node, return the last node's value
		const lastVar = nodeVars.get(sortedNodes[sortedNodes.length - 1].id);
		statements.push(`return ${lastVar};`);
	} else {
		statements.push('return null;');
	}
	
	return statements.join('\n');
}

/**
 * Compile individual node expressions for evaluation
 * Returns a map of nodeId -> JavaScript expression
 */
export function compileNodeExpressions(graph: Graph): Map<string, string> {
	const nodeVars = new Map<string, string>();
	
	// Find all nodes that need to be compiled
	const sortedNodes = topologicalSort(graph);
	
	// Compile each node to a JavaScript expression
	const nodeExpressions = new Map<string, string>();
	
	for (const node of sortedNodes) {
		const varName = `node_${node.id}`;
		const jsExpr = compileNodeToJS(node, graph, nodeVars);
		nodeVars.set(node.id, varName);
		
		// Generate a complete expression for this node
		const dependencies: string[] = [];
		for (const [id, varName] of nodeVars.entries()) {
			if (id !== node.id) {
				dependencies.push(`const ${varName} = node_${id};`);
			}
		}
		
		nodeExpressions.set(node.id, jsExpr);
	}
	
	return nodeExpressions;
}

/**
 * Compile a single node to JavaScript expression
 */
function compileNodeToJS(
	node: GraphNode,
	graph: Graph,
	nodeVars: Map<string, string>
): string {
	// Get input expression for this node
	const getInputExpression = (portName: string): string => {
		const edge = graph.edges.find(e => e.to.node === node.id && e.to.port === portName);
		if (edge) {
			const sourceNode = graph.nodes.find(n => n.id === edge.from.node);
			const sourceVar = nodeVars.get(edge.from.node) || 'null';
			
			// Special handling for Input node with property access
			if (sourceNode && sourceNode.type === 'Input' && edge.from.port !== 'out') {
				return `input.${edge.from.port}`;
			}
			
			return sourceVar;
		}
		return 'null';
	};
	
	switch (node.type) {
		case 'Input':
			// Input node provides access to the input data
			return 'input';
			
		case 'Expression': {
			// Expression node contains a JavaScript expression with dynamic inputs
			let expression = node.data.expression || 'null';
			
			// Find all edges targeting this node
			const inputEdges = graph.edges.filter(e => e.to.node === node.id);
			
			// Build a map of input port names to their expressions
			const inputMap = new Map<string, string>();
			for (const edge of inputEdges) {
				const sourceVar = nodeVars.get(edge.from.node) || 'null';
				const sourceNode = graph.nodes.find(n => n.id === edge.from.node);
				
				// Special handling for Input node with property access
				if (sourceNode && sourceNode.type === 'Input' && edge.from.port !== 'out') {
					inputMap.set(edge.to.port, `input.${edge.from.port}`);
				} else {
					inputMap.set(edge.to.port, sourceVar);
				}
			}
			
			// Replace input references in the expression
			// Sort by key length descending to avoid partial replacements
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
				const sourceVar = nodeVars.get(edge.from.node) || 'null';
				const propertyName = edge.to.port;
				properties.push(`"${propertyName}": ${sourceVar}`);
			}
			
			return `{${properties.join(', ')}}`;
		}
			
		case 'If': {
			const condition = getInputExpression('condition');
			const trueVal = getInputExpression('true');
			const falseVal = getInputExpression('false');
			return `(${condition} ? ${trueVal} : ${falseVal})`;
		}
		
		case 'Match': {
			// Compile Match node to JavaScript switch-like expression
			const value = getInputExpression('value');
			const cases = node.data.cases || {};
			
			// Build a switch-like structure using nested ternaries
			// cases format: { "caseName": ["value1", "value2", ...] }
			let expression = 'null'; // default if no cases
			
			// Start from the end to build nested ternaries
			const caseEntries = Object.entries(cases);
			for (let i = caseEntries.length - 1; i >= 0; i--) {
				const [caseName, caseValues] = caseEntries[i];
				const values = Array.isArray(caseValues) ? caseValues : [caseValues];
				
				// Create condition: value === val1 || value === val2 || ...
				const conditions = values.map(v => {
					const stringValue = typeof v === 'string' ? `"${v}"` : String(v);
					return `(${value}) === ${stringValue}`;
				}).join(' || ');
				
				// Get the expression for this case output
				const caseOutput = getInputExpression(caseName) || value;
				
				expression = `(${conditions}) ? ${caseOutput} : ${expression}`;
			}
			
			// Add default case at the end
			const defaultOutput = getInputExpression('default') || value;
			expression = expression === 'null' ? defaultOutput : expression.replace(/: null$/, `: ${defaultOutput}`);
			
			return expression;
		}
		
		case 'Switch': {
			// Deprecated - delegates to Match behavior
			const value = getInputExpression('value');
			const cases = node.data.cases || {};
			
			// Old switch format: { "value1": "outputPort1", "value2": "outputPort2" }
			// Convert to Match format for compilation
			const matchCases: Record<string, string[]> = {};
			for (const [caseValue, outputPort] of Object.entries(cases)) {
				if (!matchCases[outputPort as string]) {
					matchCases[outputPort as string] = [];
				}
				matchCases[outputPort as string].push(caseValue);
			}
			
			let expression = 'null';
			const caseEntries = Object.entries(matchCases);
			for (let i = caseEntries.length - 1; i >= 0; i--) {
				const [outputPort, values] = caseEntries[i];
				const conditions = values.map(v => {
					const stringValue = typeof v === 'string' ? `"${v}"` : String(v);
					return `(${value}) === ${stringValue}`;
				}).join(' || ');
				
				const caseOutput = getInputExpression(outputPort) || value;
				expression = `(${conditions}) ? ${caseOutput} : ${expression}`;
			}
			
			const defaultOutput = getInputExpression('default') || value;
			expression = expression === 'null' ? defaultOutput : expression.replace(/: null$/, `: ${defaultOutput}`);
			
			return expression;
		}
			
		case 'Map': {
			const array = getInputExpression('array');
			const exprInput = getInputExpression('expression');
			// Map operation: array.map(element => expression)
			// We need to replace 'element' in the expression with the actual element
			return `${array}.map(element => ${exprInput})`;
		}
			
		case 'Filter': {
			const array = getInputExpression('array');
			const exprInput = getInputExpression('expression');
			// Filter operation: array.filter(element => expression)
			return `${array}.filter(element => ${exprInput})`;
		}
			
		case 'Reduce': {
			const array = getInputExpression('array');
			const initial = getInputExpression('initial');
			const exprInput = getInputExpression('expression');
			// Reduce operation: array.reduce((accumulator, element) => expression, initial)
			return `${array}.reduce((accumulator, element) => ${exprInput}, ${initial})`;
		}
		
		case 'Range': {
			// Generate a series of numbers from start to end with step
			const start = getInputExpression('start');
			const end = getInputExpression('end');
			const step = getInputExpression('step');
			return `Array.from({length: Math.floor((${end} - ${start}) / ${step}) + 1}, (_, i) => ${start} + i * ${step})`;
		}
		
		case 'Length': {
			// Get the length of an array
			const array = getInputExpression('array');
			return `${array}.length`;
		}
		
		case 'GetItem': {
			// Access array element by index
			const array = getInputExpression('array');
			const index = getInputExpression('index');
			return `${array}[${index}]`;
		}
		
		case 'Concat': {
			// Concatenate arrays
			// Find all edges targeting this node to get all array inputs
			const inputEdges = graph.edges.filter(e => e.to.node === node.id);
			const arrays = inputEdges
				.filter(e => e.to.port.startsWith('array'))
				.map(e => nodeVars.get(e.from.node) || 'null');
			
			if (arrays.length === 0) {
				return '[]';
			} else if (arrays.length === 1) {
				return arrays[0];
			} else {
				return `${arrays[0]}.concat(${arrays.slice(1).join(', ')})`;
			}
		}
		
		case 'CreateDate': {
			// Convert CreateDate node to Date constructor
			const value = getInputExpression('value');
			return `new Date(${value})`;
		}
		
		case 'AddDate': {
			// Convert AddDate node to date manipulation
			const date = getInputExpression('date');
			const days = getInputExpression('days');
			const hours = getInputExpression('hours');
			
			// Apply transformations in sequence
			let result = `new Date(${date})`;
			if (days !== 'null') {
				result = `(function(d) { const nd = new Date(d); nd.setDate(nd.getDate() + ${days}); return nd; })(${result})`;
			}
			if (hours !== 'null') {
				result = `(function(d) { const nd = new Date(d); nd.setHours(nd.getHours() + ${hours}); return nd; })(${result})`;
			}
			return result;
		}
		
		case 'FormatDate': {
			// Convert FormatDate node to date formatting
			const date = getInputExpression('date');
			const format = getInputExpression('format');
			return `formatDate(new Date(${date}), ${format})`;
		}
			
		case 'Output':
			// Output node just passes through its input
			return getInputExpression('result') || getInputExpression('in');
			
		default:
			// Unknown node type
			if (typeof console !== 'undefined' && console.warn) {
				console.warn(`Unknown node type during JS compilation: ${node.type}`);
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
	
	// Reverse to get dependency order
	return sorted.reverse();
}
