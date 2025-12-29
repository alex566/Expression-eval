import type {
	Graph,
	GraphNode,
	GraphEdge,
	NodeContext,
	EvaluationResult,
	ValidationResult,
	NodeRegistry,
	InferredTypeInfo
} from './types';
import type { TSTypeCheckResult } from './ts-type-checker';
import { TSTypeCheckerClient } from './ts-type-checker-client';

/**
 * Graph evaluator - executes the dataflow graph with type inference
 */
export class GraphEvaluator {
	private nodeValues: Map<string, Map<string, any>> = new Map();
	private inferredTypes: Map<string, InferredTypeInfo> = new Map();
	private executedNodes: Set<string> = new Set();
	private tsTypeChecker: TSTypeCheckerClient | null = null;

	constructor(
		private graph: Graph,
		private registry: NodeRegistry,
		enableTypeScript: boolean = true
	) {
		// Initialize TypeScript type checker using Web Worker (browser-compatible)
		if (enableTypeScript) {
			try {
				this.tsTypeChecker = new TSTypeCheckerClient(registry);
				if (!this.tsTypeChecker.isAvailable()) {
					console.warn('TypeScript type checker not available, using simple type checking');
					this.tsTypeChecker = null;
				}
			} catch (error) {
				console.warn('Failed to initialize TypeScript type checker:', error);
				this.tsTypeChecker = null;
			}
		}
	}

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

			// 5. Use TypeScript-based type checking for powerful type inference (if available)
			// Note: TSTypeChecker is only available server-side to avoid bundling TypeScript compiler in browser
			let tsCheckResult: TSTypeCheckResult | null = null;
			if (this.tsTypeChecker) {
				tsCheckResult = await this.tsTypeChecker.checkGraph(this.graph);
				
				// Merge TypeScript errors and warnings
				errors.push(...tsCheckResult.errors);
				warnings.push(...tsCheckResult.warnings);
			}

			// 6. Infer types for Value nodes using TS inference (if available)
			for (const node of this.graph.nodes) {
				const definition = this.registry.get(node.type);
				if (!definition) continue;

				// For Value nodes, get the inferred TypeScript type
				if (node.type === 'Value' && node.data.value !== undefined) {
					const key = `${node.id}.out`;
					const tsTypeInfo = tsCheckResult?.inferredTypes[key];
					const outputPort = definition.outputs?.[0];
					
					if (tsTypeInfo) {
						inferredTypes[key] = {
							type: tsTypeInfo.type,
							declaredType: outputPort?.type,
							isCompatible: outputPort ? (this.tsTypeChecker?.areTypesCompatible(tsTypeInfo.type, outputPort.type) ?? true) : true
						};
					} else if (outputPort) {
						// Fallback: use simple type inference when TS checker is not available
						const simpleType = this.inferSimpleTypeFromValue(node.data.value);
						inferredTypes[key] = {
							type: simpleType,
							declaredType: outputPort.type,
							isCompatible: this.areSimpleTypesCompatible(simpleType, outputPort.type)
						};
					}
				}
			}

			// 7. Type check edges based on TypeScript inference (if available) or simple type checking
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

				// Get TypeScript types from inference
				const sourceKey = `${edge.from.node}.${edge.from.port}`;
				const sourceTsType = tsCheckResult?.inferredTypes[sourceKey]?.type || sourcePort?.type || 'any';
				const targetTsType = targetPort?.type || 'any';

				// Check type compatibility using TS types (if available) or simple type checking
				const compatible = this.tsTypeChecker 
					? this.tsTypeChecker.areTypesCompatible(sourceTsType, targetTsType)
					: this.areSimpleTypesCompatible(sourceTsType, targetTsType);

				if (!compatible) {
					errors.push(
						`Type mismatch: cannot connect '${sourceNode.type}.${edge.from.port}' (${sourceTsType}) ` +
						`to '${targetNode.type}.${edge.to.port}' (expected ${targetTsType})`
					);
				}

				// Store inferred type information for the target input
				inferredTypes[`${edge.to.node}.input.${edge.to.port}`] = {
					type: sourceTsType,
					declaredType: targetTsType,
					isCompatible: compatible
				};
			}

			// 8. Check for unreachable nodes (optional warning)
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
		// Check if this node has already produced all its outputs
		const definition = this.registry.get(node.type);
		if (!definition) {
			throw new Error(`Node type '${node.type}' not found in registry`);
		}

		// Check if all connected inputs are ready before executing
		const incomingEdges = this.graph.edges.filter((edge) => edge.to.node === node.id);
		const nodeValues = this.nodeValues.get(node.id);
		
		// If there are incoming edges, check that all connected inputs have values
		if (incomingEdges.length > 0) {
			const allInputsReady = incomingEdges.every(edge => {
				const inputKey = `input.${edge.to.port}`;
				return nodeValues?.has(inputKey);
			});
			
			if (!allInputsReady) {
				// Not all inputs are ready yet, skip execution
				return;
			}
		}

		// Check if already executed (for nodes without outputs)
		if ((!definition.outputs || definition.outputs.length === 0) && this.executedNodes.has(node.id)) {
			return;
		}

		// Create context for this node
		const context = this.createNodeContext(node);

		// Execute the node
		await definition.execute(context);

		// Mark as executed (for nodes without outputs)
		if (!definition.outputs || definition.outputs.length === 0) {
			this.executedNodes.add(node.id);
		}

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
			getNodeData: () => ({
				...node.data,
				// Include functions list if it exists (needed for FunctionRef and array operation nodes)
				...(this.graph.functions ? { functions: this.graph.functions } : {})
			})
		};
	}

	/**
	 * Infer type for a port based on its value and store type information
	 */
	private inferTypeForPort(nodeId: string, port: string, value: any, declaredType?: string): void {
		const key = `${nodeId}.${port}`;
		
		// Infer TypeScript type from value
		const inferredType = this.inferTSTypeFromValue(value);
		
		this.inferredTypes.set(key, {
			type: inferredType,
			declaredType,
			isCompatible: declaredType 
				? (this.tsTypeChecker?.areTypesCompatible(inferredType, declaredType) ?? this.areSimpleTypesCompatible(inferredType, declaredType))
				: true
		});
	}

	/**
	 * Infer TypeScript type from a runtime value (helper method)
	 */
	private inferTSTypeFromValue(value: any): string {
		if (value === null || value === undefined) {
			return 'any';
		}
		if (value instanceof Date) {
			return 'Date';
		}
		if (Array.isArray(value)) {
			if (value.length === 0) {
				return 'any[]';
			}
			const elementType = this.inferTSTypeFromValue(value[0]);
			return `${elementType}[]`;
		}
		if (typeof value === 'object') {
			const props: string[] = [];
			for (const [key, val] of Object.entries(value)) {
				const valueType = this.inferTSTypeFromValue(val);
				props.push(`${key}: ${valueType}`);
			}
			return props.length > 0 ? `{ ${props.join('; ')} }` : 'Record<string, any>';
		}
		if (typeof value === 'number') {
			return 'number';
		}
		if (typeof value === 'string') {
			return 'string';
		}
		if (typeof value === 'boolean') {
			return 'boolean';
		}
		return 'any';
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
				if (outputPort && value !== undefined) {
					const actualType = this.inferTSTypeFromValue(value);
					const compatible = this.tsTypeChecker
						? this.tsTypeChecker.areTypesCompatible(actualType, outputPort.type)
						: this.areSimpleTypesCompatible(actualType, outputPort.type);
					if (!compatible) {
						throw new Error(
							`Type mismatch at node '${node.id}' output port '${edge.from.port}': ` +
							`expected '${outputPort.type}' but got '${actualType}'`
						);
					}
				}
			}

			// Type checking: verify value matches target input type
			const targetNode = this.graph.nodes.find((n) => n.id === edge.to.node);
			if (targetNode) {
				const targetDefinition = this.registry.get(targetNode.type);
				if (targetDefinition?.inputs) {
					const inputPort = targetDefinition.inputs.find(p => p.name === edge.to.port);
					if (inputPort && value !== undefined) {
						const actualType = this.inferTSTypeFromValue(value);
						const compatible = this.tsTypeChecker
							? this.tsTypeChecker.areTypesCompatible(actualType, inputPort.type)
							: this.areSimpleTypesCompatible(actualType, inputPort.type);
						if (!compatible) {
							throw new Error(
								`Type mismatch: cannot connect '${node.type}.${edge.from.port}' (${actualType}) ` +
								`to '${targetNode.type}.${edge.to.port}' (expected ${inputPort.type})`
							);
						}
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

	/**
	 * Simple type inference from runtime value (fallback when TS checker not available)
	 */
	private inferSimpleTypeFromValue(value: any): string {
		if (value === null || value === undefined) {
			return 'any';
		}
		if (value instanceof Date) {
			return 'Date';
		}
		if (Array.isArray(value)) {
			return 'any[]'; // Simplified, don't infer element type
		}
		if (typeof value === 'object') {
			return 'object';
		}
		return typeof value; // 'number', 'string', 'boolean', etc.
	}

	/**
	 * Simple type compatibility check (fallback when TS checker not available)
	 */
	private areSimpleTypesCompatible(sourceType: string, targetType: string): boolean {
		// 'any' is compatible with everything
		if (targetType === 'any' || sourceType === 'any') {
			return true;
		}

		// Direct match
		if (sourceType === targetType) {
			return true;
		}

		// Handle basic array types
		if (targetType.endsWith('[]') && sourceType.endsWith('[]')) {
			return true; // Simplified: don't check element types
		}

		// Handle union types in target (simplified)
		if (targetType.includes(' | ')) {
			const targetTypes = targetType.split(' | ').map(t => t.trim());
			return targetTypes.some(t => this.areSimpleTypesCompatible(sourceType, t));
		}

		return false;
	}
}
