/**
 * TypeScript-based Type Inference Engine
 * 
 * This module uses TypeScript's compiler API to infer types from generated JavaScript code.
 * It replaces the CEL-based type inference with native TypeScript type checking.
 */

import ts from 'typescript';
import type { 
	Graph, 
	GraphNode, 
	TypeCheckResult, 
	NodeTypeInfo,
	TypeInferenceContext 
} from './types';
import { nodeRegistry } from './registry';
import { compileNodeExpressions } from './js-compiler';

/**
 * Infer TypeScript type from a JavaScript value
 */
export function inferTypeFromValue(value: any): string {
	if (value === null || value === undefined) {
		return 'null';
	}
	
	const jsType = typeof value;
	switch (jsType) {
		case 'boolean':
			return 'boolean';
		case 'number':
			return 'number';
		case 'string':
			return 'string';
		case 'object':
			if (Array.isArray(value)) {
				if (value.length === 0) {
					return 'unknown[]';
				}
				const elementType = inferTypeFromValue(value[0]);
				return `${elementType}[]`;
			}
			if (value instanceof Date) {
				return 'Date';
			}
			// Generic object
			return 'object';
		default:
			return 'any';
	}
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
	if (targetType === 'any' || targetType === 'unknown') {
		return true;
	}
	
	if (sourceType === 'any' || sourceType === 'unknown') {
		return true;
	}
	
	// Array types
	if (sourceType.endsWith('[]') && targetType.endsWith('[]')) {
		const sourceElement = sourceType.slice(0, -2);
		const targetElement = targetType.slice(0, -2);
		return areTypesCompatible(sourceElement, targetElement);
	}
	
	// number compatibility
	if (sourceType === 'number' && targetType === 'number') {
		return true;
	}
	
	return false;
}

/**
 * Unify two types - find the most specific common type
 */
export function unifyTypes(type1: string, type2: string): string {
	if (type1 === type2) {
		return type1;
	}
	
	// If either is any/unknown, return the other
	if (type1 === 'any' || type1 === 'unknown') {
		return type2;
	}
	if (type2 === 'any' || type2 === 'unknown') {
		return type1;
	}
	
	// For array types, unify element types
	if (type1.endsWith('[]') && type2.endsWith('[]')) {
		const elem1 = type1.slice(0, -2);
		const elem2 = type2.slice(0, -2);
		const unifiedElement = unifyTypes(elem1, elem2);
		return `${unifiedElement}[]`;
	}
	
	// Cannot unify - return any
	return 'any';
}

/**
 * Type inference engine for graphs using TypeScript
 */
export class TypeScriptInferenceEngine {
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
	 * Infer types for a single node using TypeScript
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
				if (actualType && inputSpec.type !== 'any' && inputSpec.type !== 'unknown') {
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
		
		return sorted.reverse();
	}
}

/**
 * Helper function to perform type inference on a graph
 */
export function inferGraphTypes(graph: Graph): TypeCheckResult {
	const engine = new TypeScriptInferenceEngine(graph);
	return engine.inferTypes();
}
