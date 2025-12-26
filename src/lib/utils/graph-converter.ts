import type { Node, Edge } from '@xyflow/svelte';
import type { Graph, PortSpec, InferredTypeInfo } from '../dataflow/types';
import { nodeRegistry } from '../dataflow/registry';
import dagre from 'dagre';

/**
 * Determine input and output ports for a node based on its type
 * Returns PortSpec arrays from the node definition, or creates fallback PortSpec objects
 * If inferredTypes are provided, updates the port types with inferred runtime types
 * Special handling for Value, Output nodes and dynamic nodes to create ports based on data/edges
 */
function getNodePorts(
	nodeType: string, 
	nodeId: string,
	nodeData: Record<string, any>,
	edges: Array<{ from: { node: string; port: string }; to: { node: string; port: string } }>,
	inferredTypes?: Record<string, InferredTypeInfo>
): { inputs: PortSpec[]; outputs: PortSpec[] } {
	// Get ports from the node definition in the registry
	const definition = nodeRegistry.get(nodeType);
	let inputs: PortSpec[] = [];
	let outputs: PortSpec[] = [];

	// Special handling for Value node - single output
	if (nodeType === 'Value') {
		outputs = [{ name: 'out', type: 'any' as const }];
	}
	// Special handling for Output node - create inputs based on configuration
	else if (nodeType === 'Output') {
		const outputNames = nodeData.outputs || ['output'];
		inputs = outputNames.map((name: string) => ({ name, type: 'any' as const }));
	}
	// Standard node - use definition
	else if (definition?.inputs && definition?.outputs) {
		inputs = definition.inputs.map(p => ({ ...p }));
		outputs = definition.outputs.map(p => ({ ...p }));
		
		// If inputs or outputs are empty (dynamic nodes), detect from edges
		if (inputs.length === 0) {
			// Find all edges targeting this node and extract unique port names
			const inputPorts = new Set<string>();
			edges.forEach(edge => {
				if (edge.to.node === nodeId) {
					inputPorts.add(edge.to.port);
				}
			});
			inputs = Array.from(inputPorts).sort().map(name => ({ name, type: 'any' as const }));
		}
		
		if (outputs.length === 0 && nodeType !== 'Output') {
			// For nodes with no outputs defined, assume 'out' port
			outputs = [{ name: 'out', type: 'any' as const }];
		}
	} else {
		// Fallback to hardcoded configs if not found in registry (for backward compatibility)
		const portConfigs: Record<string, { inputs: string[]; outputs: string[] }> = {
			Value: { inputs: [], outputs: ['out'] },
			Output: { inputs: [], outputs: [] }, // Handled specially above
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
 * Convert dataflow graph to SvelteFlow format with dagre horizontal layout
 * Optionally accepts inferred types to display runtime type information
 */
export function graphToSvelteFlow(
	graph: Graph, 
	inferredTypes?: Record<string, InferredTypeInfo>
): { nodes: Node[]; edges: Edge[] } {
	const nodes: Node[] = [];
	const edges: Edge[] = [];

	// Create a new dagre graph with horizontal layout (LR = Left to Right)
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));
	
	// Configure the graph layout
	dagreGraph.setGraph({ 
		rankdir: 'LR', // Left to Right (horizontal layout with output on the right)
		nodesep: 100,  // Vertical spacing between nodes
		ranksep: 200,  // Horizontal spacing between ranks/levels
		edgesep: 50,   // Spacing between edges
		marginx: 50,
		marginy: 50
	});

	// First pass: Create nodes with their data and add to dagre graph
	graph.nodes.forEach((node) => {
		const ports = getNodePorts(node.type, node.id, node.data, graph.edges, inferredTypes);
		
		// Add node to dagre graph with dimensions
		// Approximate node size based on content
		const nodeWidth = 200;
		const nodeHeight = Math.max(100, 40 + Math.max(ports.inputs.length, ports.outputs.length) * 25);
		
		dagreGraph.setNode(node.id, { 
			width: nodeWidth, 
			height: nodeHeight,
			// Store additional data we'll need later
			nodeType: node.type,
			nodeData: node.data,
			ports: ports
		});
	});

	// Add edges to dagre graph
	graph.edges.forEach((edge) => {
		dagreGraph.setEdge(edge.from.node, edge.to.node);
	});

	// Run dagre layout algorithm
	dagre.layout(dagreGraph);

	// Second pass: Extract positioned nodes from dagre
	graph.nodes.forEach((node) => {
		const dagreNode = dagreGraph.node(node.id) as any;
		const ports = dagreNode.ports as { inputs: PortSpec[]; outputs: PortSpec[] };

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
				// dagre returns center position, we need top-left for SvelteFlow
				x: dagreNode.x - dagreNode.width / 2,
				y: dagreNode.y - dagreNode.height / 2
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
