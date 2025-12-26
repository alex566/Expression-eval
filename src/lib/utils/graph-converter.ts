import type { Node, Edge } from '@xyflow/svelte';
import type { Graph, PortSpec } from '../dataflow/types';
import { nodeRegistry } from '../dataflow/registry';

/**
 * Determine input and output ports for a node based on its type
 * Returns PortSpec arrays from the node definition, or creates fallback PortSpec objects
 */
function getNodePorts(nodeType: string): { inputs: PortSpec[]; outputs: PortSpec[] } {
	// Get ports from the node definition in the registry
	const definition = nodeRegistry.get(nodeType);
	if (definition?.inputs && definition?.outputs) {
		return {
			inputs: definition.inputs,
			outputs: definition.outputs
		};
	}

	// Fallback to hardcoded configs if not found in registry (for backward compatibility)
	// These will be converted to PortSpec objects with 'any' type
	const portConfigs: Record<string, { inputs: string[]; outputs: string[] }> = {
		Start: { inputs: [], outputs: ['A', 'B'] }, // Start node outputs multiple ports
		Add: { inputs: ['in'], outputs: ['out'] },
		Subtract: { inputs: ['in'], outputs: ['out'] },
		Multiply: { inputs: ['in'], outputs: ['out'] },
		Divide: { inputs: ['in'], outputs: ['out'] },
		Collect: { inputs: ['result'], outputs: ['out'] },
		Output: { inputs: ['in'], outputs: [] },
		If: { inputs: ['condition', 'true', 'false'], outputs: ['out'] },
		Compare: { inputs: ['a', 'b'], outputs: ['out'] },
		ForEach: { inputs: ['array'], outputs: ['out', 'count'] },
		Map: { inputs: ['array'], outputs: ['out'] }
	};

	const config = portConfigs[nodeType] || { inputs: ['in'], outputs: ['out'] };
	// Convert string arrays to PortSpec arrays
	return {
		inputs: config.inputs.map(name => ({ name, type: 'any' as const })),
		outputs: config.outputs.map(name => ({ name, type: 'any' as const }))
	};
}

/**
 * Convert dataflow graph to SvelteFlow format with horizontal layout
 */
export function graphToSvelteFlow(graph: Graph): { nodes: Node[]; edges: Edge[] } {
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
		const ports = getNodePorts(node.type);

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
