import type {
	Graph,
	GraphNode,
	GraphEdge,
	NodeContext,
	EvaluationResult,
	ValidationResult,
	NodeRegistry,
	DataType,
	InferredTypeInfo
} from './types';
import { isTypeCompatible, getValueType, areTypesCompatible } from './types';

/**
 * Graph evaluator - executes the dataflow graph with type inference
 */
export class GraphEvaluator {
	private nodeValues: Map<string, Map<string, any>> = new Map();
	private inferredTypes: Map<string, InferredTypeInfo> = new Map();
	private executedNodes: Set<string> = new Set();

	constructor(
		private graph: Graph,
		private registry: NodeRegistry
	) {}

	/**
	 * Evaluate the graph and return the result
	 */
	async evaluate(): Promise<EvaluationResult> {
		try {
			this.nodeValues.clear();
			this.inferredTypes.clear();
			this.executedNodes.clear();

			// Find start nodes (nodes with no incoming edges)
			const startNodes = this.findStartNodes();

			// Execute nodes in topological order (in parallel for independent branches)
			await Promise.all(startNodes.map((node) => this.executeNode(node)));

			// Collect outputs from all nodes
			const outputs: Record<string, any> = {};
			for (const [nodeId, values] of this.nodeValues.entries()) {
				for (const [port, value] of values.entries()) {
					outputs[`${nodeId}.${port}`] = value;
				}
			}

			// Convert inferred types map to record for result
			const inferredTypesRecord: Record<string, InferredTypeInfo> = {};
			for (const [key, typeInfo] of this.inferredTypes.entries()) {
				inferredTypesRecord[key] = typeInfo;
			}

			return {
				success: true,
				outputs,
				inferredTypes: inferredTypesRecord
			};
		} catch (error) {
			return {
				success: false,
				outputs: {},
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}

	/**
	 * Validate the graph structure and perform type checking with type inference
	 * This does NOT execute the graph, only validates it
	 */
	async validate(): Promise<ValidationResult> {
		const errors: string[] = [];
		const warnings: string[] = [];
		const inferredTypes: Record<string, InferredTypeInfo> = {};

		try {
			// 1. Check for basic graph structure issues
			if (this.graph.nodes.length === 0) {
				errors.push('Graph has no nodes');
				return { success: false, errors, warnings, inferredTypes };
			}

			// 2. Check all nodes have valid types in registry
			const nodeMap = new Map<string, GraphNode>();
			for (const node of this.graph.nodes) {
				nodeMap.set(node.id, node);
				const definition = this.registry.get(node.type);
				if (!definition) {
					errors.push(`Node '${node.id}' has unknown type '${node.type}'`);
				}
			}

			// 3. Check all edges reference valid nodes
			for (const edge of this.graph.edges) {
				if (!nodeMap.has(edge.from.node)) {
					errors.push(`Edge references non-existent source node '${edge.from.node}'`);
				}
				if (!nodeMap.has(edge.to.node)) {
					errors.push(`Edge references non-existent target node '${edge.to.node}'`);
				}
			}

			// If we have basic errors, return early
			if (errors.length > 0) {
				return { success: false, errors, warnings, inferredTypes };
			}

			// 4. Check for cycles (basic cycle detection)
			const cycleCheck = this.detectCycles();
			if (cycleCheck.hasCycle) {
				errors.push(`Graph contains cycles: ${cycleCheck.cycleDescription}`);
			}

			// 5. Infer types for Value nodes and constant data
			for (const node of this.graph.nodes) {
				const definition = this.registry.get(node.type);
				if (!definition) continue;

				// For Value nodes, infer type from the value
				if (node.type === 'Value' && node.data.value !== undefined) {
					const valueType = getValueType(node.data.value);
					const outputPort = definition.outputs?.[0];
					inferredTypes[`${node.id}.out`] = {
						inferredType: valueType,
						declaredType: outputPort?.type,
						isCompatible: outputPort ? isTypeCompatible(node.data.value, outputPort.type) : true
					};
				}
			}

			// 6. Type check edges based on node definitions
			for (const edge of this.graph.edges) {
				const sourceNode = nodeMap.get(edge.from.node);
				const targetNode = nodeMap.get(edge.to.node);
				
				if (!sourceNode || !targetNode) continue;

				const sourceDefinition = this.registry.get(sourceNode.type);
				const targetDefinition = this.registry.get(targetNode.type);

				if (!sourceDefinition || !targetDefinition) continue;

				// Get port specifications
				const sourcePort = sourceDefinition.outputs?.find(p => p.name === edge.from.port);
				const targetPort = targetDefinition.inputs?.find(p => p.name === edge.to.port);

				// If we have inferred type for source, use it; otherwise use declared type
				const sourceKey = `${edge.from.node}.${edge.from.port}`;
				const sourceType = inferredTypes[sourceKey]?.inferredType || sourcePort?.type || 'any';
				const targetType = targetPort?.type || 'any';

				// Check type compatibility
				if (!areTypesCompatible(sourceType, targetType)) {
					errors.push(
						`Type mismatch: cannot connect '${sourceNode.type}.${edge.from.port}' (${sourceType}) ` +
						`to '${targetNode.type}.${edge.to.port}' (expected ${targetType})`
					);
				}

				// Store inferred type information for the target input
				inferredTypes[`${edge.to.node}.input.${edge.to.port}`] = {
					inferredType: sourceType,
					declaredType: targetType,
					isCompatible: areTypesCompatible(sourceType, targetType)
				};
			}

			// 7. Check for unreachable nodes (optional warning)
			const reachableNodes = this.findReachableNodes();
			for (const node of this.graph.nodes) {
				if (!reachableNodes.has(node.id)) {
					warnings.push(`Node '${node.id}' (${node.type}) is not reachable from any input`);
				}
			}

			return {
				success: errors.length === 0,
				errors,
				warnings,
				inferredTypes
			};
		} catch (error) {
			errors.push(error instanceof Error ? error.message : String(error));
			return {
				success: false,
				errors,
				warnings,
				inferredTypes
			};
		}
	}

	/**
	 * Detect cycles in the graph using DFS
	 */
	private detectCycles(): { hasCycle: boolean; cycleDescription: string } {
		const visited = new Set<string>();
		const recursionStack = new Set<string>();
		const adjacency = new Map<string, string[]>();

		// Build adjacency list
		for (const node of this.graph.nodes) {
			adjacency.set(node.id, []);
		}
		for (const edge of this.graph.edges) {
			const neighbors = adjacency.get(edge.from.node) || [];
			neighbors.push(edge.to.node);
			adjacency.set(edge.from.node, neighbors);
		}

		// DFS helper
		const dfs = (nodeId: string, path: string[]): string | null => {
			visited.add(nodeId);
			recursionStack.add(nodeId);
			path.push(nodeId);

			const neighbors = adjacency.get(nodeId) || [];
			for (const neighbor of neighbors) {
				if (!visited.has(neighbor)) {
					const cycle = dfs(neighbor, [...path]);
					if (cycle) return cycle;
				} else if (recursionStack.has(neighbor)) {
					// Found a cycle
					const cycleStart = path.indexOf(neighbor);
					return path.slice(cycleStart).concat(neighbor).join(' -> ');
				}
			}

			recursionStack.delete(nodeId);
			return null;
		};

		// Check each node
		for (const node of this.graph.nodes) {
			if (!visited.has(node.id)) {
				const cycle = dfs(node.id, []);
				if (cycle) {
					return { hasCycle: true, cycleDescription: cycle };
				}
			}
		}

		return { hasCycle: false, cycleDescription: '' };
	}

	/**
	 * Find all reachable nodes from start nodes
	 */
	private findReachableNodes(): Set<string> {
		const reachable = new Set<string>();
		const startNodes = this.findStartNodes();
		const adjacency = new Map<string, string[]>();

		// Build adjacency list
		for (const node of this.graph.nodes) {
			adjacency.set(node.id, []);
		}
		for (const edge of this.graph.edges) {
			const neighbors = adjacency.get(edge.from.node) || [];
			neighbors.push(edge.to.node);
			adjacency.set(edge.from.node, neighbors);
		}

		// BFS from start nodes
		const queue = [...startNodes.map(n => n.id)];
		while (queue.length > 0) {
			const current = queue.shift()!;
			if (reachable.has(current)) continue;
			
			reachable.add(current);
			const neighbors = adjacency.get(current) || [];
			queue.push(...neighbors);
		}

		return reachable;
	}

	/**
	 * Find nodes with no incoming edges
	 */
	private findStartNodes(): GraphNode[] {
		const nodesWithInputs = new Set<string>();
		for (const edge of this.graph.edges) {
			nodesWithInputs.add(edge.to.node);
		}

		return this.graph.nodes.filter((node) => !nodesWithInputs.has(node.id));
	}

	/**
	 * Execute a single node and propagate values to connected nodes
	 */
	private async executeNode(node: GraphNode): Promise<void> {
		if (this.executedNodes.has(node.id)) {
			return;
		}

		const definition = this.registry.get(node.type);
		if (!definition) {
			throw new Error(`Node type '${node.type}' not found in registry`);
		}

		// Create context for this node
		const context = this.createNodeContext(node);

		// Execute the node
		await definition.execute(context);

		this.executedNodes.add(node.id);

		// Propagate outputs to connected nodes
		await this.propagateOutputs(node);
	}

	/**
	 * Create execution context for a node
	 */
	private createNodeContext(node: GraphNode): NodeContext {
		if (!this.nodeValues.has(node.id)) {
			this.nodeValues.set(node.id, new Map());
		}

		const definition = this.registry.get(node.type);

		return {
			getInputValue: (port: string) => {
				const values = this.nodeValues.get(node.id);
				return values?.get(`input.${port}`);
			},
			setOutputValue: (port: string, value: any) => {
				const values = this.nodeValues.get(node.id);
				values?.set(port, value);
				
				// Infer and store type information
				this.inferTypeForPort(node.id, port, value, definition?.outputs?.find(p => p.name === port)?.type);
			},
			getNodeData: () => node.data
		};
	}

	/**
	 * Infer type for a port based on its value and store type information
	 */
	private inferTypeForPort(nodeId: string, port: string, value: any, declaredType?: DataType): void {
		const inferredType = getValueType(value);
		const key = `${nodeId}.${port}`;
		
		this.inferredTypes.set(key, {
			inferredType,
			declaredType,
			isCompatible: declaredType ? isTypeCompatible(value, declaredType) : true
		});
	}

	/**
	 * Propagate node outputs to connected nodes
	 */
	private async propagateOutputs(node: GraphNode): Promise<void> {
		const outgoingEdges = this.graph.edges.filter((edge) => edge.from.node === node.id);
		const definition = this.registry.get(node.type);

		for (const edge of outgoingEdges) {
			const sourceValues = this.nodeValues.get(edge.from.node);
			const value = sourceValues?.get(edge.from.port);

			// Type checking: verify output type matches port specification
			if (definition?.outputs) {
				const outputPort = definition.outputs.find(p => p.name === edge.from.port);
				if (outputPort && value !== undefined && !isTypeCompatible(value, outputPort.type)) {
					const actualType = getValueType(value);
					throw new Error(
						`Type mismatch at node '${node.id}' output port '${edge.from.port}': ` +
						`expected '${outputPort.type}' but got '${actualType}'`
					);
				}
			}

			// Type checking: verify value matches target input type
			const targetNode = this.graph.nodes.find((n) => n.id === edge.to.node);
			if (targetNode) {
				const targetDefinition = this.registry.get(targetNode.type);
				if (targetDefinition?.inputs) {
					const inputPort = targetDefinition.inputs.find(p => p.name === edge.to.port);
					if (inputPort && value !== undefined && !isTypeCompatible(value, inputPort.type)) {
						const actualType = getValueType(value);
						throw new Error(
							`Type mismatch: cannot connect '${node.type}.${edge.from.port}' (${actualType}) ` +
							`to '${targetNode.type}.${edge.to.port}' (expected ${inputPort.type})`
						);
					}
				}

				// Set the value as input to the target node
				if (!this.nodeValues.has(edge.to.node)) {
					this.nodeValues.set(edge.to.node, new Map());
				}
				const targetValues = this.nodeValues.get(edge.to.node);
				targetValues?.set(`input.${edge.to.port}`, value);

				// Infer type for input port
				const targetDefinition2 = this.registry.get(targetNode.type);
				const inputPortSpec = targetDefinition2?.inputs?.find(p => p.name === edge.to.port);
				this.inferTypeForPort(edge.to.node, `input.${edge.to.port}`, value, inputPortSpec?.type);

				// Execute the target node (reusing targetNode from above)
				await this.executeNode(targetNode);
			}
		}
	}
}
