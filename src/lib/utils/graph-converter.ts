import type { Node, Edge } from '@xyflow/svelte';
import type { Graph, PortSpec } from '../dataflow/types';
import { PinMode } from '../dataflow/types';
import { nodeRegistry } from '../dataflow/registry';
import { inferGraphTypes } from '../dataflow/type-inference';
import dagre from 'dagre';

/**
 * Extended dagre node type that includes our custom properties
 */
interface DagreNode {
	x: number;
	y: number;
	width: number;
	height: number;
	ports: { inputs: PortSpec[]; outputs: PortSpec[] };
	nodeType: string;
	nodeData: Record<string, any>;
}

/**
 * Helper function to determine the type string for a schema value
 */
function getSchemaType(value: any): string {
	if (typeof value === 'object' && Array.isArray(value)) {
		return 'array';
	}
	if (typeof value === 'object') {
		return 'object';
	}
	return typeof value;
}

/**
 * Determine input and output ports for a node based on its type
 * Returns PortSpec arrays from the node definition, or creates fallback PortSpec objects
 * Special handling for Value, Output nodes and dynamic nodes to create ports based on data/edges
 * Optionally accepts inferred types to override default 'any' types
 */
function getNodePorts(
	nodeType: string, 
	nodeId: string,
	nodeData: Record<string, any>,
	edges: Array<{ from: { node: string; port: string }; to: { node: string; port: string } }>,
	inferredInputTypes?: Record<string, string>,
	inferredOutputTypes?: Record<string, string>
): { inputs: PortSpec[]; outputs: PortSpec[] } {
	// Get ports from the node definition in the registry
	const definition = nodeRegistry.get(nodeType);
	let inputs: PortSpec[] = [];
	let outputs: PortSpec[] = [];

	// Special handling for Input node - create outputs based on input data structure if available
	if (nodeType === 'Input') {
		// Check if inputSchema is provided in node data
		const inputSchema = nodeData.inputSchema;
		const inputSchemaTypes = nodeData.inputSchemaTypes; // User-defined types override
		
		if (inputSchema && typeof inputSchema === 'object') {
			// Create output pins for each top-level property in the input schema
			const keys = Object.keys(inputSchema);
			outputs = keys.map(key => {
				// Use user-defined type if available, otherwise infer from schema
				const type = inputSchemaTypes?.[key] || getSchemaType(inputSchema[key]);
				return { 
					name: key, 
					type,
					nameMode: PinMode.Static, // Name from schema is static
					typeMode: inputSchemaTypes?.[key] ? PinMode.Static : PinMode.Inferred
				};
			});
		}
		// Always add a generic 'out' port for the whole input object
		if (outputs.length === 0 || !outputs.some(o => o.name === 'out')) {
			outputs.push({ 
				name: 'out', 
				type: 'any' as const,
				nameMode: PinMode.Static,
				typeMode: PinMode.Static
			});
		}
	}
	// Special handling for Value node - single output
	else if (nodeType === 'Value') {
		outputs = [{ name: 'out', type: 'any' as const }];
	}
	// Special handling for Output node - create inputs based on configuration or infer from edges
	else if (nodeType === 'Output') {
		// First, try to infer input pins from connected edges (like dynamic nodes)
		const inputPorts = new Set<string>();
		const outputNames = nodeData.outputNames || {}; // Map of port to custom name
		
		edges.forEach(edge => {
			if (edge.to.node === nodeId) {
				// Infer input pin name from the edge's target port name
				inputPorts.add(edge.to.port);
			}
		});
		
		// If we have inferred ports from edges, use them
		if (inputPorts.size > 0) {
			inputs = Array.from(inputPorts).sort().map(name => ({
				name,
				type: 'any' as const,
				// If there's a custom name for this port, use it as display name
				...(outputNames[name] ? { displayName: outputNames[name] } : {}),
				nameMode: outputNames[name] ? PinMode.Static : PinMode.Inferred
			}));
		} else {
			// Fallback to configured outputs for backward compatibility
			const configuredOutputs = nodeData.outputs || ['output'];
			inputs = configuredOutputs.map((name: string) => ({ 
				name, 
				type: 'any' as const,
				nameMode: PinMode.Static
			}));
		}
		
		// Add one extra input pin to allow adding more outputs dynamically
		// This enables the "auto-add" functionality when a pin is attached
		const usedNames = new Set(inputs.map(i => i.name));
		let nextIndex = 0;
		let nextName = `out${nextIndex}`;
		while (usedNames.has(nextName)) {
			nextIndex++;
			nextName = `out${nextIndex}`;
		}
		inputs.push({ 
			name: nextName, 
			type: 'any' as const,
			nameMode: PinMode.Inferred
		});
	}
	// Standard node - use definition
	else if (definition?.inputs && definition?.outputs) {
		inputs = definition.inputs.map(p => ({
			...p,
			nameMode: p.nameMode || PinMode.Static,
			typeMode: p.typeMode || (nodeType === 'If' && (p.name === 'true' || p.name === 'false') ? PinMode.Inferred : PinMode.Static)
		}));
		outputs = definition.outputs.map(p => ({
			...p,
			nameMode: p.nameMode || PinMode.Static,
			typeMode: p.typeMode || (nodeType === 'If' ? PinMode.Inferred : PinMode.Static)
		}));
		
		// For Expression and If nodes, check if output name is customized
		if ((nodeType === 'Expression' || nodeType === 'If') && nodeData.outputName) {
			// Replace default 'out' port with custom name
			outputs = outputs.map(port => {
				if (port.name === 'out') {
					return {
						...port,
						name: nodeData.outputName,
						nameMode: PinMode.Static
					};
				}
				return port;
			});
		}
		
		// If inputs are empty (dynamic nodes), detect from edges and add extra connector
		if (inputs.length === 0) {
			// Find all edges targeting this node and extract unique port names
			const inputPorts = new Set<string>();
			edges.forEach(edge => {
				if (edge.to.node === nodeId) {
					inputPorts.add(edge.to.port);
				}
			});
			
			// For Expression nodes, try to infer better input names from connected output names
			if (nodeType === 'Expression') {
				// Build a map of input port names to their display names (inferred from source)
				const portDisplayNames = new Map<string, string>();
				
				edges.forEach(edge => {
					if (edge.to.node === nodeId) {
						// Use the source port name as the display name
						// This makes the pin show the name of the connected output
						const sourcePortName = edge.from.port;
						const targetPortName = edge.to.port;
						
						// Only use the source name if it's meaningful (not just "out")
						// Otherwise fall back to the target port name
						if (sourcePortName !== 'out' && sourcePortName) {
							portDisplayNames.set(targetPortName, sourcePortName);
						}
					}
				});
				
				// Create inputs with inferred display names
				inputs = Array.from(inputPorts).sort().map(name => ({
					name,
					type: 'any' as const,
					// Add display name if we inferred one
					...(portDisplayNames.has(name) ? { displayName: portDisplayNames.get(name) } : {}),
					nameMode: PinMode.Inferred,
					typeMode: PinMode.Inferred
				}));
			} else {
				inputs = Array.from(inputPorts).sort().map(name => ({ 
					name, 
					type: 'any' as const,
					nameMode: PinMode.Inferred,
					typeMode: PinMode.Inferred
				}));
			}
			
			// For nodes with dynamic inputs (defined with empty inputs array),
			// always add one extra connector for new connections
			// Find the next available input connector index
			const nextInputIndex = inputs.length;
			inputs.push({ 
				name: `in${nextInputIndex}`, 
				type: 'any' as const,
				nameMode: PinMode.Inferred,
				typeMode: PinMode.Inferred
			});
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

	// Apply inferred types if available
	if (inferredInputTypes) {
		inputs = inputs.map(port => ({
			...port,
			type: inferredInputTypes[port.name] || port.type
		}));
	}
	
	if (inferredOutputTypes) {
		outputs = outputs.map(port => ({
			...port,
			type: inferredOutputTypes[port.name] || port.type
		}));
	}

	return { inputs, outputs };
}

/**
 * Convert dataflow graph to SvelteFlow format with dagre horizontal layout
 * Optionally accepts callbacks for handling node interactions
 */
export function graphToSvelteFlow(
	graph: Graph, 
	onNodeDoubleClick?: (nodeId: string) => void,
	onNodeEdit?: (nodeId: string) => void
): { nodes: Node[]; edges: Edge[] } {
	const nodes: Node[] = [];
	const edges: Edge[] = [];

	// Run type inference to get proper types for all nodes
	const typeCheckResult = inferGraphTypes(graph);
	const nodeTypeInfo = typeCheckResult.nodeTypes;

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
		const typeInfo = nodeTypeInfo.get(node.id);
		const ports = getNodePorts(
			node.type, 
			node.id, 
			node.data, 
			graph.edges,
			typeInfo?.inputTypes,
			typeInfo?.outputTypes
		);
		
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
		// Safe to cast because we control the node data structure set in the first pass
		const dagreNode = dagreGraph.node(node.id) as DagreNode;
		const ports = dagreNode.ports;

		// Check if this node is a FunctionValue node
		const isFunctionValue = node.type === 'FunctionValue';

		// For Map/Filter/Reduce nodes, find connected Expression node and extract expression body
		let expressionBody: string | null = null;
		if (node.type === 'Map' || node.type === 'Filter' || node.type === 'Reduce') {
			const expressionEdge = graph.edges.find(e => e.to.node === node.id && e.to.port === 'expression');
			if (expressionEdge) {
				const expressionNode = graph.nodes.find(n => n.id === expressionEdge.from.node);
				if (expressionNode && expressionNode.type === 'Expression') {
					expressionBody = expressionNode.data.expression || null;
				}
			}
		}

		nodes.push({
			id: node.id,
			type: 'custom', // Use custom node type
			data: {
				label: node.type,
				nodeId: node.id,
				nodeType: node.type,
				inputs: ports.inputs,
				outputs: ports.outputs,
				hasSubgraph: isFunctionValue,
				onNodeDoubleClick,
				onNodeEdit,
				expressionBody, // Add expression body for array operation nodes
				...node.data // Include original node data (like value)
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
			selectable: true,
			deletable: true,
			style: 'stroke: #3b82f6; stroke-width: 2px;'
		});
	});

	return { nodes, edges };
}

/**
 * Update nodes and edges while preserving existing node positions
 * This is used when only the node data (like inferred types) changes, not the structure
 * Optionally accepts callbacks for handling node interactions
 */
export function updateFlowWithPreservedPositions(
	graph: Graph,
	existingNodes: Node[],
	onNodeDoubleClick?: (nodeId: string) => void,
	onNodeEdit?: (nodeId: string) => void
): { nodes: Node[]; edges: Edge[] } {
	const nodes: Node[] = [];
	const edges: Edge[] = [];

	// Run type inference to get proper types for all nodes
	const typeCheckResult = inferGraphTypes(graph);
	const nodeTypeInfo = typeCheckResult.nodeTypes;

	// Create a map of existing positions and extract callbacks from existing nodes
	const positionMap = new Map<string, { x: number; y: number }>();
	let callbackFromExisting: ((nodeId: string) => void) | undefined;
	let editCallbackFromExisting: ((nodeId: string) => void) | undefined;
	existingNodes.forEach(node => {
		positionMap.set(node.id, node.position);
		// Extract callbacks from first node that has them
		if (!callbackFromExisting && node.data?.onNodeDoubleClick) {
			callbackFromExisting = node.data.onNodeDoubleClick as (nodeId: string) => void;
		}
		if (!editCallbackFromExisting && node.data?.onNodeEdit) {
			editCallbackFromExisting = node.data.onNodeEdit as (nodeId: string) => void;
		}
	});

	// Use provided callbacks or fallback to existing callbacks
	const nodeCallback = onNodeDoubleClick || callbackFromExisting;
	const editCallback = onNodeEdit || editCallbackFromExisting;

	// Create nodes with preserved positions
	graph.nodes.forEach((node) => {
		const typeInfo = nodeTypeInfo.get(node.id);
		const ports = getNodePorts(
			node.type, 
			node.id, 
			node.data, 
			graph.edges,
			typeInfo?.inputTypes,
			typeInfo?.outputTypes
		);
		const existingPosition = positionMap.get(node.id);

		// Check if this node is a FunctionValue node
		const isFunctionValue = node.type === 'FunctionValue';

		// For Map/Filter/Reduce nodes, find connected Expression node and extract expression body
		let expressionBody: string | null = null;
		if (node.type === 'Map' || node.type === 'Filter' || node.type === 'Reduce') {
			const expressionEdge = graph.edges.find(e => e.to.node === node.id && e.to.port === 'expression');
			if (expressionEdge) {
				const expressionNode = graph.nodes.find(n => n.id === expressionEdge.from.node);
				if (expressionNode && expressionNode.type === 'Expression') {
					expressionBody = expressionNode.data.expression || null;
				}
			}
		}

		nodes.push({
			id: node.id,
			type: 'custom',
			data: {
				label: node.type,
				nodeId: node.id,
				nodeType: node.type,
				inputs: ports.inputs,
				outputs: ports.outputs,
				hasSubgraph: isFunctionValue,
				onNodeDoubleClick: nodeCallback,
				onNodeEdit: editCallback,
				expressionBody, // Add expression body for array operation nodes
				...node.data // Include original node data
			},
			position: existingPosition || { x: 0, y: 0 } // Use existing position or default
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
			selectable: true,
			deletable: true,
			style: 'stroke: #3b82f6; stroke-width: 2px;'
		});
	});

	return { nodes, edges };
}
