import type { Node, Edge } from '@xyflow/svelte';
import type { Graph } from '../dataflow/types';

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

	// Convert nodes with horizontal layout
	graph.nodes.forEach((node) => {
		const level = levels.get(node.id) || 0;
		const counter = levelCounters.get(level) || 0;
		levelCounters.set(level, counter + 1);

		const totalNodesInLevel = nodesPerLevel.get(level) || 1;
		const verticalSpacing = 100;
		const yOffset = (counter - (totalNodesInLevel - 1) / 2) * verticalSpacing;

		nodes.push({
			id: node.id,
			type: 'default',
			data: {
				label: `${node.type} (${node.id})`
			},
			position: {
				x: level * 300,
				y: 200 + yOffset
			}
		});
	});

	// Convert edges without handles (let SvelteFlow connect node centers)
	graph.edges.forEach((edge, index) => {
		edges.push({
			id: `e${index}`,
			source: edge.from.node,
			target: edge.to.node,
			label: `${edge.from.port} → ${edge.to.port}`,
			animated: true
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
