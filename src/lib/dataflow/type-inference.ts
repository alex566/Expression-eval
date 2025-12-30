/**
 * Type Inference Engine for CEL Expressions
 * 
 * This module provides type inference capabilities for dataflow graphs.
 * It analyzes the graph structure and infers types for all nodes, propagating
 * types from inputs to outputs through the graph hierarchy.
 */

import type { 
	Graph, 
	GraphNode, 
	GraphEdge, 
	TypeCheckResult, 
	NodeTypeInfo,
	TypeInferenceContext 
} from './types';
import { nodeRegistry } from './registry';

/**
 * CEL type system - maps JavaScript types to CEL types
 */
export const CELTypes = {
	// Primitive types
	NULL: 'null',
	BOOL: 'bool',
	INT: 'int',
	UINT: 'uint',
	DOUBLE: 'double',
	STRING: 'string',
	BYTES: 'bytes',
	
	// Complex types
	LIST: 'list',
	MAP: 'map',
	TIMESTAMP: 'google.protobuf.Timestamp',
	DURATION: 'google.protobuf.Duration',
	
	// Special
	ANY: 'any',
	DYN: 'dyn',
} as const;

/**
 * Infer CEL type from a JavaScript value
 */
export function inferTypeFromValue(value: any): string {
	if (value === null || value === undefined) {
		return CELTypes.NULL;
	}
	
	const jsType = typeof value;
	switch (jsType) {
		case 'boolean':
			return CELTypes.BOOL;
		case 'number':
			return Number.isInteger(value) ? CELTypes.INT : CELTypes.DOUBLE;
		case 'string':
			return CELTypes.STRING;
		case 'object':
			if (Array.isArray(value)) {
				// Infer array element type if possible
				if (value.length === 0) {
					return 'list(dyn)';
				}
				const elementType = inferTypeFromValue(value[0]);
				return `list(${elementType})`;
			}
			if (value instanceof Date) {
				return CELTypes.TIMESTAMP;
			}
			// Generic map/object
			return 'map(string, dyn)';
		default:
			return CELTypes.ANY;
	}
}

/**
 * Parse a type string to extract base type and generic parameters
 */
export function parseTypeString(typeStr: string): { 
	base: string; 
	params: string[] 
} {
	const match = typeStr.match(/^(\w+)(?:\((.*)\))?$/);
	if (!match) {
		return { base: typeStr, params: [] };
	}
	
	const base = match[1];
	const paramsStr = match[2];
	const params = paramsStr ? paramsStr.split(',').map(s => s.trim()) : [];
	
	return { base, params };
}

/**
 * Check if two types are compatible
 */
export function areTypesCompatible(sourceType: string, targetType: string): boolean {
	// Exact match
	if (sourceType === targetType) {
		return true;
	}
	
	// Any type is compatible with everything
	if (targetType === CELTypes.ANY || targetType === CELTypes.DYN) {
		return true;
	}
	
	if (sourceType === CELTypes.ANY || sourceType === CELTypes.DYN) {
		return true;
	}
	
	// Parse generic types
	const source = parseTypeString(sourceType);
	const target = parseTypeString(targetType);
	
	// Base types must match for generic types
	if (source.base !== target.base) {
		// Special cases: int can be coerced to double
		if (source.base === CELTypes.INT && target.base === CELTypes.DOUBLE) {
			return true;
		}
		if (source.base === CELTypes.UINT && target.base === CELTypes.INT) {
			return true;
		}
		if (source.base === CELTypes.UINT && target.base === CELTypes.DOUBLE) {
			return true;
		}
		return false;
	}
	
	// Check generic parameters
	if (source.params.length !== target.params.length) {
		return false;
	}
	
	for (let i = 0; i < source.params.length; i++) {
		if (!areTypesCompatible(source.params[i], target.params[i])) {
			return false;
		}
	}
	
	return true;
}

/**
 * Unify two types - find the most specific common type
 */
export function unifyTypes(type1: string, type2: string): string {
	if (type1 === type2) {
		return type1;
	}
	
	// If either is any/dyn, return the other
	if (type1 === CELTypes.ANY || type1 === CELTypes.DYN) {
		return type2;
	}
	if (type2 === CELTypes.ANY || type2 === CELTypes.DYN) {
		return type1;
	}
	
	// Numeric type unification
	if ((type1 === CELTypes.INT || type1 === CELTypes.UINT) && 
	    (type2 === CELTypes.INT || type2 === CELTypes.UINT)) {
		return CELTypes.INT;
	}
	
	if ((type1 === CELTypes.INT || type1 === CELTypes.UINT || type1 === CELTypes.DOUBLE) && 
	    (type2 === CELTypes.INT || type2 === CELTypes.UINT || type2 === CELTypes.DOUBLE)) {
		return CELTypes.DOUBLE;
	}
	
	// For list types, unify element types
	const parsed1 = parseTypeString(type1);
	const parsed2 = parseTypeString(type2);
	
	if (parsed1.base === 'list' && parsed2.base === 'list' && 
	    parsed1.params.length > 0 && parsed2.params.length > 0) {
		const unifiedElement = unifyTypes(parsed1.params[0], parsed2.params[0]);
		return `list(${unifiedElement})`;
	}
	
	// Cannot unify - return dyn
	return CELTypes.DYN;
}

/**
 * Type inference engine for graphs
 */
export class TypeInferenceEngine {
	private graph: Graph;
	private nodeTypes: Map<string, NodeTypeInfo>;
	private errors: string[];
	private warnings: string[];
	
	constructor(graph: Graph) {
		this.graph = graph;
		this.nodeTypes = new Map();
		this.errors = [];
		this.warnings = [];
	}
	
	/**
	 * Perform type inference on the entire graph
	 * Returns type information for all nodes
	 */
	inferTypes(): TypeCheckResult {
		this.nodeTypes.clear();
		this.errors = [];
		this.warnings = [];
		
		// Topological sort to process nodes in dependency order
		const sorted = this.topologicalSort();
		if (!sorted) {
			return {
				valid: false,
				nodeTypes: this.nodeTypes,
				errors: this.errors,
				warnings: this.warnings
			};
		}
		
		// Infer types for each node in order
		for (const node of sorted) {
			this.inferNodeTypes(node);
		}
		
		// Validate edge type compatibility
		this.validateEdges();
		
		return {
			valid: this.errors.length === 0,
			nodeTypes: this.nodeTypes,
			errors: this.errors,
			warnings: this.warnings
		};
	}
	
	/**
	 * Infer types for a single node
	 */
	private inferNodeTypes(node: GraphNode): void {
		const definition = nodeRegistry.get(node.type);
		if (!definition) {
			this.errors.push(`Unknown node type: ${node.type} (node ${node.id})`);
			return;
		}
		
		const nodeInfo: NodeTypeInfo = {
			nodeId: node.id,
			nodeType: node.type,
			inputTypes: {},
			outputTypes: {},
			errors: []
		};
		
		// Get input types from connected edges
		const inputEdges = this.graph.edges.filter(e => e.to.node === node.id);
		for (const edge of inputEdges) {
			const sourceNodeInfo = this.nodeTypes.get(edge.from.node);
			if (sourceNodeInfo) {
				const sourceType = sourceNodeInfo.outputTypes[edge.from.port];
				if (sourceType) {
					nodeInfo.inputTypes[edge.to.port] = sourceType;
				}
			}
		}
		
		// Infer output types based on node type and inputs
		if (definition.inferOutputTypes) {
			// Use custom inference function if provided
			const context: TypeInferenceContext = {
				getInputType: (port: string) => nodeInfo.inputTypes[port],
				getNodeData: () => node.data
			};
			
			try {
				const inferredOutputs = definition.inferOutputTypes(context);
				nodeInfo.outputTypes = inferredOutputs;
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				nodeInfo.errors.push(`Type inference error: ${errorMsg}`);
				this.errors.push(`Node ${node.id} (${node.type}): ${errorMsg}`);
			}
		} else {
			// Use declared output types from definition
			if (definition.outputs) {
				for (const output of definition.outputs) {
					nodeInfo.outputTypes[output.name] = output.type;
				}
			}
		}
		
		// Special handling for nodes with static values
		if (node.type === 'Value' && node.data.value !== undefined) {
			const inferredType = inferTypeFromValue(node.data.value);
			nodeInfo.outputTypes['out'] = inferredType;
		}
		
		// Validate input types against declaration
		if (definition.inputs) {
			for (const inputSpec of definition.inputs) {
				const actualType = nodeInfo.inputTypes[inputSpec.name];
				if (actualType && inputSpec.type !== 'any' && inputSpec.type !== 'dyn') {
					// Check if types are compatible
					const declaredTypes = inputSpec.type.split('|').map(t => t.trim());
					const compatible = declaredTypes.some(dt => areTypesCompatible(actualType, dt));
					
					if (!compatible) {
						const errorMsg = `Input '${inputSpec.name}' expects type '${inputSpec.type}' but got '${actualType}'`;
						nodeInfo.errors.push(errorMsg);
						this.errors.push(`Node ${node.id} (${node.type}): ${errorMsg}`);
					}
				}
			}
		}
		
		this.nodeTypes.set(node.id, nodeInfo);
	}
	
	/**
	 * Validate that edge connections have compatible types
	 */
	private validateEdges(): void {
		for (const edge of this.graph.edges) {
			const sourceNode = this.nodeTypes.get(edge.from.node);
			const targetNode = this.nodeTypes.get(edge.to.node);
			
			if (!sourceNode || !targetNode) {
				continue;
			}
			
			const sourceType = sourceNode.outputTypes[edge.from.port];
			const targetType = targetNode.inputTypes[edge.to.port];
			
			if (sourceType && targetType) {
				// Types are already set during inference, just validate compatibility
				if (!areTypesCompatible(sourceType, targetType)) {
					this.warnings.push(
						`Type mismatch at edge ${edge.from.node}.${edge.from.port} -> ${edge.to.node}.${edge.to.port}: ` +
						`'${sourceType}' is not compatible with '${targetType}'`
					);
				}
			}
		}
	}
	
	/**
	 * Topological sort of nodes
	 * Returns nodes in dependency order (inputs before outputs)
	 */
	private topologicalSort(): GraphNode[] | null {
		const sorted: GraphNode[] = [];
		const visited = new Set<string>();
		const visiting = new Set<string>();
		
		// Build adjacency map
		const adjacency = new Map<string, string[]>();
		for (const node of this.graph.nodes) {
			adjacency.set(node.id, []);
		}
		for (const edge of this.graph.edges) {
			const neighbors = adjacency.get(edge.from.node) || [];
			neighbors.push(edge.to.node);
			adjacency.set(edge.from.node, neighbors);
		}
		
		// DFS visit
		const visit = (nodeId: string): boolean => {
			if (visited.has(nodeId)) return true;
			if (visiting.has(nodeId)) {
				this.errors.push(`Cycle detected in graph at node: ${nodeId}`);
				return false;
			}
			
			visiting.add(nodeId);
			
			const neighbors = adjacency.get(nodeId) || [];
			for (const neighbor of neighbors) {
				if (!visit(neighbor)) {
					return false;
				}
			}
			
			visiting.delete(nodeId);
			visited.add(nodeId);
			
			const node = this.graph.nodes.find(n => n.id === nodeId);
			if (node) {
				sorted.push(node);
			}
			
			return true;
		};
		
		// Visit all nodes
		for (const node of this.graph.nodes) {
			if (!visit(node.id)) {
				return null;
			}
		}
		
		// Reverse to get dependency order
		return sorted.reverse();
	}
	
	/**
	 * Get type information for a specific node
	 */
	getNodeTypeInfo(nodeId: string): NodeTypeInfo | undefined {
		return this.nodeTypes.get(nodeId);
	}
	
	/**
	 * Get output type for a specific node port
	 */
	getOutputType(nodeId: string, portName: string): string | undefined {
		const nodeInfo = this.nodeTypes.get(nodeId);
		return nodeInfo?.outputTypes[portName];
	}
}

/**
 * Helper function to perform type inference on a graph
 */
export function inferGraphTypes(graph: Graph): TypeCheckResult {
	const engine = new TypeInferenceEngine(graph);
	return engine.inferTypes();
}
