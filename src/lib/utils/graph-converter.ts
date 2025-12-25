import type { Node, Edge } from '@xyflow/svelte';
import type { Graph } from '../dataflow/types';

/**
 * Convert dataflow graph to SvelteFlow format
 */
export function graphToSvelteFlow(graph: Graph): { nodes: Node[]; edges: Edge[] } {
	const nodes: Node[] = [];
	const edges: Edge[] = [];

	// Convert nodes
	graph.nodes.forEach((node, index) => {
		nodes.push({
			id: node.id,
			type: 'default',
			data: {
				label: `${node.type} (${node.id})`,
				...node.data
			},
			position: {
				x: index * 250,
				y: 0
			}
		});
	});

	// Convert edges
	graph.edges.forEach((edge, index) => {
		edges.push({
			id: `e${index}`,
			source: edge.from.node,
			target: edge.to.node,
			sourceHandle: edge.from.port,
			targetHandle: edge.to.port,
			label: `${edge.from.port} → ${edge.to.port}`
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
