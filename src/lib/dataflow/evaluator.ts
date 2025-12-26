import type {
	Graph,
	GraphNode,
	GraphEdge,
	NodeContext,
	EvaluationResult,
	NodeRegistry
} from './types';
import { isTypeCompatible, getValueType } from './types';

/**
 * Graph evaluator - executes the dataflow graph
 */
export class GraphEvaluator {
	private nodeValues: Map<string, Map<string, any>> = new Map();
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

			return {
				success: true,
				outputs
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

		return {
			getInputValue: (port: string) => {
				const values = this.nodeValues.get(node.id);
				return values?.get(`input.${port}`);
			},
			setOutputValue: (port: string, value: any) => {
				const values = this.nodeValues.get(node.id);
				values?.set(port, value);
			},
			getNodeData: () => node.data
		};
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

				// Execute the target node (reusing targetNode from above)
				await this.executeNode(targetNode);
			}
		}
	}
}
