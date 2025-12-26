import type { Node, Edge } from '@xyflow/svelte';
import type { Graph } from '../dataflow/types';

/**
 * Determine input and output ports for a node based on its type
 */
function getNodePorts(nodeType: string): { inputs: string[]; outputs: string[] } {
	// Define port configurations for each node type
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

	return portConfigs[nodeType] || { inputs: ['in'], outputs: ['out'] };
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

		const ports = getNodePorts(node.type);

		nodes.push({
			id: node.id,
			type: 'custom', // Use custom node type
			data: {
				label: `${node.type} (${node.id})`,
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
