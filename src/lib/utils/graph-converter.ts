import type { Node, Edge } from '@xyflow/svelte';
import type { Graph, PortSpec, InferredTypeInfo } from '../dataflow/types';
import { nodeRegistry } from '../dataflow/registry';

/**
 * Determine input and output ports for a node based on its type
 * Returns PortSpec arrays from the node definition, or creates fallback PortSpec objects
 * If inferredTypes are provided, updates the port types with inferred runtime types
 * Special handling for Start and Output nodes to create dynamic ports based on data
 */
function getNodePorts(
	nodeType: string, 
	nodeId: string,
	nodeData: Record<string, any>,
	inferredTypes?: Record<string, InferredTypeInfo>
): { inputs: PortSpec[]; outputs: PortSpec[] } {
	// Get ports from the node definition in the registry
	const definition = nodeRegistry.get(nodeType);
	let inputs: PortSpec[] = [];
	let outputs: PortSpec[] = [];

	// Special handling for Start node - create outputs based on input data
	if (nodeType === 'Start') {
		const value = nodeData.value || {};
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			// Create output port for each property in the value object
			outputs = Object.keys(value).map(key => ({ name: key, type: 'any' as const }));
		} else {
			// Single output for non-object values
			outputs = [{ name: 'out', type: 'any' as const }];
		}
	}
	// Special handling for Output node - create inputs based on configuration
	else if (nodeType === 'Output') {
		const outputNames = nodeData.outputs || ['output'];
		inputs = outputNames.map((name: string) => ({ name, type: 'any' as const }));
	}
	// For Collect node, create inputs based on configuration
	else if (nodeType === 'Collect') {
		const inputNames = nodeData.inputs || ['result'];
		inputs = inputNames.map((name: string) => ({ name, type: 'any' as const }));
		outputs = [{ name: 'out', type: 'object' as const }];
	}
	// Standard node - use definition
	else if (definition?.inputs && definition?.outputs) {
		inputs = definition.inputs.map(p => ({ ...p }));
		outputs = definition.outputs.map(p => ({ ...p }));
	} else {
		// Fallback to hardcoded configs if not found in registry (for backward compatibility)
		const portConfigs: Record<string, { inputs: string[]; outputs: string[] }> = {
			Start: { inputs: [], outputs: [] }, // Handled specially above
			Output: { inputs: [], outputs: [] }, // Handled specially above
			Collect: { inputs: ['result'], outputs: ['out'] }, // Has special handling above
			Add: { inputs: ['in'], outputs: ['out'] },
			Subtract: { inputs: ['in'], outputs: ['out'] },
			Multiply: { inputs: ['in'], outputs: ['out'] },
			Divide: { inputs: ['in'], outputs: ['out'] },
			If: { inputs: ['condition', 'true', 'false'], outputs: ['out'] },
			Compare: { inputs: ['a', 'b'], outputs: ['out'] },
			ForEach: { inputs: ['array'], outputs: ['out', 'count'] },
			Map: { inputs: ['array'], outputs: ['out'] }
		};

		const config = portConfigs[nodeType] || { inputs: ['in'], outputs: ['out'] };
		inputs = config.inputs.map(name => ({ name, type: 'any' as const }));
		outputs = config.outputs.map(name => ({ name, type: 'any' as const }));
	}

	// Override with inferred types if available
	if (inferredTypes) {
		inputs = inputs.map(port => {
			const key = `${nodeId}.input.${port.name}`;
			const inferred = inferredTypes[key];
			return {
				name: port.name,
				type: inferred?.inferredType || port.type
			};
		});

		outputs = outputs.map(port => {
			const key = `${nodeId}.${port.name}`;
			const inferred = inferredTypes[key];
			return {
				name: port.name,
				type: inferred?.inferredType || port.type
			};
		});
	}

	return { inputs, outputs };
}

/**
 * Convert dataflow graph to SvelteFlow format with horizontal layout
 * Optionally accepts inferred types to display runtime type information
 */
export function graphToSvelteFlow(
	graph: Graph, 
	inferredTypes?: Record<string, InferredTypeInfo>
): { nodes: Node[]; edges: Edge[] } {
	const nodes: Node[] = [];
	const edges: Edge[] = [];

	// Build adjacency map to determine node levels (for horizontal layout)
	const inDegree = new Map<string, number>();
	const adjacency = new Map<string, string[]>();
	
	graph.nodes.forEach(node => {
		inDegree.set(node.id, 0);
		adjacency.set(node.id, []);
	});

	graph.edges.forEach(edge => {
		inDegree.set(edge.to.node, (inDegree.get(edge.to.node) || 0) + 1);
		const neighbors = adjacency.get(edge.from.node) || [];
		neighbors.push(edge.to.node);
		adjacency.set(edge.from.node, neighbors);
	});

	// Assign levels using topological sort
	const levels = new Map<string, number>();
	const queue: string[] = [];
	
	graph.nodes.forEach(node => {
		if (inDegree.get(node.id) === 0) {
			levels.set(node.id, 0);
			queue.push(node.id);
		}
	});

	while (queue.length > 0) {
		const current = queue.shift()!;
		const currentLevel = levels.get(current) || 0;
		const neighbors = adjacency.get(current) || [];
		
		neighbors.forEach(neighbor => {
			const degree = (inDegree.get(neighbor) || 0) - 1;
			inDegree.set(neighbor, degree);
			
			const nextLevel = currentLevel + 1;
			levels.set(neighbor, Math.max(levels.get(neighbor) || 0, nextLevel));
			
			if (degree === 0) {
				queue.push(neighbor);
			}
		});
	}

	// Count nodes per level for vertical positioning
	const nodesPerLevel = new Map<number, number>();
	graph.nodes.forEach(node => {
		const level = levels.get(node.id) || 0;
		nodesPerLevel.set(level, (nodesPerLevel.get(level) || 0) + 1);
	});

	const levelCounters = new Map<number, number>();

	// Convert nodes with horizontal layout and custom node type
	graph.nodes.forEach((node) => {
		const level = levels.get(node.id) || 0;
		const counter = levelCounters.get(level) || 0;
		levelCounters.set(level, counter + 1);

		const totalNodesInLevel = nodesPerLevel.get(level) || 1;
		const verticalSpacing = 100;
		const yOffset = (counter - (totalNodesInLevel - 1) / 2) * verticalSpacing;

		const definition = nodeRegistry.get(node.type);
		const ports = getNodePorts(node.type, node.id, node.data, inferredTypes);

		// Use ports directly since getNodePorts now always returns PortSpec arrays
		nodes.push({
			id: node.id,
			type: 'custom', // Use custom node type
			data: {
				label: node.type,
				nodeId: node.id,
				inputs: ports.inputs,
				outputs: ports.outputs
			},
			position: {
				x: level * 300,
				y: 200 + yOffset
			}
		});
	});

	// Convert edges with proper source and target handles
	graph.edges.forEach((edge, index) => {
		edges.push({
			id: `e${index}`,
			source: edge.from.node,
			target: edge.to.node,
			sourceHandle: edge.from.port,
			targetHandle: edge.to.port,
			animated: true,
			style: 'stroke: #3b82f6; stroke-width: 2px;'
		});
	});

	return { nodes, edges };
}

/**
 * Layout nodes in a better way (simple horizontal layout)
 */
export function layoutNodes(nodes: Node[]): Node[] {
	return nodes.map((node, index) => ({
		...node,
		position: {
			x: index * 250,
			y: Math.floor(index / 4) * 150
		}
	}));
}
