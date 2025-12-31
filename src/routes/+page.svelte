<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteFlow, Controls, Background, type Node, type Edge, type Connection } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import type { Graph, GraphNode, GraphEdge } from '$lib/dataflow/types';
	import { nodeRegistry } from '$lib/dataflow/registry';
	import { registerAllNodes } from '$lib/nodes';
	import { graphToSvelteFlow, updateFlowWithPreservedPositions } from '$lib/utils/graph-converter';
	import CustomNode from '$lib/components/CustomNode.svelte';
	import CELConsole from '$lib/components/CELConsole.svelte';
	import AddNodeModal from '$lib/components/AddNodeModal.svelte';
	import NodeEditModal from '$lib/components/NodeEditModal.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import NodeListPanel from '$lib/components/NodeListPanel.svelte';
	import SampleGraphsPanel from '$lib/components/SampleGraphsPanel.svelte';
	import { GRAPHS } from '$lib/data/graphs';

	let nodes = $state.raw<Node[]>([]);
	let edges = $state.raw<Edge[]>([]);
	let graph: Graph | null = $state(null);
	let isLoading = $state(true);
	let error = $state('');
	let selectedGraph = $state('sample');
	let showAddNodeModal = $state(false);
	let showEditNodeModal = $state(false);
	let editingNode = $state<GraphNode | null>(null);
	
	// Node values after evaluation
	let nodeValues = $state<Map<string, any>>(new Map());

	// Breadcrumb navigation state
	interface BreadcrumbItem {
		label: string;
		nodeId?: string;
		graph: Graph;
	}
	let breadcrumbs = $state<BreadcrumbItem[]>([]);
	let currentGraph = $state<Graph | null>(null);

	// Register custom node types for SvelteFlow
	const nodeTypes = {
		custom: CustomNode
	};

	onMount(async () => {
		try {
			// Register all predefined nodes
			registerAllNodes();

			// Load sample graph
			loadGraph(selectedGraph);

			isLoading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			isLoading = false;
		}
	});

	function loadGraph(graphKey: string) {
		try {
			// Load graph from embedded data
			graph = GRAPHS[graphKey];
			if (!graph) {
				throw new Error(`Graph '${graphKey}' not found`);
			}

			// Reset breadcrumbs and navigation
			breadcrumbs = [{ label: 'Main Graph', graph }];
			currentGraph = graph;

			// Convert to SvelteFlow format with double-click handlers
			const flow = graphToSvelteFlow(graph, handleNodeDoubleClick, handleNodeEdit);
			nodes = flow.nodes;
			edges = flow.edges;

			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
	}

	function handleNodeDoubleClick(nodeId: string) {
		handleNodeClick({ detail: { nodeId } } as CustomEvent);
	}

	function handleNodeEdit(nodeId: string) {
		if (!currentGraph) return;

		// Find the node to edit
		const node = currentGraph.nodes.find(n => n.id === nodeId);
		if (!node) return;

		editingNode = node;
		showEditNodeModal = true;
	}

	function handleNodeEditSave(nodeId: string, updates: Record<string, any>) {
		if (!graph) return;

		// Find the node to determine if we need to update edges
		const node = graph.nodes.find(n => n.id === nodeId);
		if (!node) return;

		// Check if output name is being changed for Expression or If nodes
		let updatedEdges = [...graph.edges];
		if ((node.type === 'Expression' || node.type === 'If') && updates.outputName) {
			const oldPortName = node.data.outputName || 'out';
			const newPortName = updates.outputName;
			
			// Update all edges that connect FROM this node's output port
			if (oldPortName !== newPortName) {
				updatedEdges = graph.edges.map(edge => {
					if (edge.from.node === nodeId && edge.from.port === oldPortName) {
						return {
							...edge,
							from: {
								...edge.from,
								port: newPortName
							}
						};
					}
					return edge;
				});
			}
		}

		// Find and update the node
		graph = {
			nodes: graph.nodes.map(n => {
				if (n.id === nodeId) {
					return {
						...n,
						data: {
							...n.data,
							...updates
						}
					};
				}
				return n;
			}),
			edges: updatedEdges
		};

		// Update current graph if different
		if (currentGraph) {
			currentGraph = {
				nodes: currentGraph.nodes.map(n => {
					if (n.id === nodeId) {
						return {
							...n,
							data: {
								...n.data,
								...updates
							}
						};
					}
					return n;
				}),
				edges: updatedEdges
			};
		}

		// Update visualization
		updateVisualizationPreservingPositions();
		showEditNodeModal = false;
		editingNode = null;
	}

	function handleNodeClick(event: CustomEvent) {
		const nodeId = event.detail.nodeId;
		if (!currentGraph) return;

		// Find the clicked node in the current graph
		const clickedNode = currentGraph.nodes.find(n => n.id === nodeId);
		if (!clickedNode) return;

		// Navigation into subgraphs is no longer supported in CEL mode
	}

	function handleBreadcrumbNavigate(index: number) {
		if (index < 0 || index >= breadcrumbs.length) return;

		// Navigate to the selected breadcrumb level
		breadcrumbs = breadcrumbs.slice(0, index + 1);
		currentGraph = breadcrumbs[index].graph;

		// Update visualization
		const flow = graphToSvelteFlow(currentGraph, handleNodeDoubleClick, handleNodeEdit);
		nodes = flow.nodes;
		edges = flow.edges;

		// Update the main graph reference if at root
		if (index === 0) {
			graph = currentGraph;
		}
	}

	function handleGraphChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedGraph = target.value;
		loadGraph(selectedGraph);
	}

	function handleGraphChangeFromPanel(graphKey: string) {
		selectedGraph = graphKey;
		loadGraph(selectedGraph);
	}

	function handlePaneClick() {
		// Open modal to add new node
		showAddNodeModal = true;
	}

	function generateNodeId(): string {
		// Generate unique node ID with higher entropy
		const timestamp = Date.now();
		const random = Math.floor(Math.random() * 999999);
		return `node_${timestamp}_${random}`;
	}

	function handleAddNode(nodeType: string, nodeData: Record<string, any>) {
		if (!graph) return;

		// Process special node data
		let processedData = { ...nodeData };
		if (nodeType === 'Output' && nodeData.outputNames) {
			// Convert comma-separated string to array
			processedData.outputs = nodeData.outputNames
				.split(',')
				.map((s: string) => s.trim())
				.filter((s: string) => s.length > 0);
			delete processedData.outputNames;
		}

		// Create new node
		const newNode: GraphNode = {
			id: generateNodeId(),
			type: nodeType,
			data: processedData
		};

		// Add node to graph
		graph = {
			nodes: [...graph.nodes, newNode],
			edges: [...graph.edges]
		};

		// Update visualization - use full layout since we're adding a new node
		// New nodes need to be positioned, so we recalculate layout
		const flow = graphToSvelteFlow(graph, handleNodeDoubleClick, handleNodeEdit);
		nodes = flow.nodes;
		edges = flow.edges;
		
		showAddNodeModal = false;
	}

	function handleConnect(connection: Connection) {
		if (!graph) return;

		// Find the target node to check if it has dynamic inputs
		const targetNode = graph.nodes.find(n => n.id === connection.target);
		if (!targetNode) return;

		// Get the node definition to check if it has dynamic inputs
		const nodeDefinition = nodeRegistry.get(targetNode.type);
		// Dynamic nodes have an empty inputs array explicitly defined
		const hasDynamicInputs = nodeDefinition?.inputs !== undefined && nodeDefinition.inputs.length === 0;

		// Determine the target port name
		// For dynamic input nodes, use the source output port name
		// For static input nodes, use the target handle (predefined input name)
		let targetPort: string;
		if (hasDynamicInputs) {
			// Use source output port name for dynamic inputs
			targetPort = connection.sourceHandle ?? 'out';
		} else {
			// Use existing target handle for static inputs
			targetPort = connection.targetHandle ?? 'in';
		}

		// Create new edge
		const newEdge: GraphEdge = {
			from: {
				node: connection.source,
				port: connection.sourceHandle ?? 'out'
			},
			to: {
				node: connection.target,
				port: targetPort
			}
		};

		// Check if edge already exists
		const edgeExists = graph.edges.some(
			(edge) =>
				edge.from.node === newEdge.from.node &&
				edge.from.port === newEdge.from.port &&
				edge.to.node === newEdge.to.node &&
				edge.to.port === newEdge.to.port
		);

		if (!edgeExists) {
			// Add edge to graph
			graph = {
				nodes: [...graph.nodes],
				edges: [...graph.edges, newEdge]
			};

			// Update visualization while preserving positions
			updateVisualizationPreservingPositions();
		}
	}

	/**
	 * Handle deletions of nodes and edges
	 * Called when user presses delete/backspace on selected elements
	 */
	function handleDelete(params: { nodes: Node[]; edges: Edge[] }) {
		if (!graph) return;

		const { nodes: deletedNodes, edges: deletedEdges } = params;
		let graphModified = false;

		// Remove deleted edges from graph
		if (deletedEdges.length > 0) {
			graph = {
				nodes: [...graph.nodes],
				edges: graph.edges.filter(edge => {
					return !deletedEdges.some(deletedEdge =>
						edge.from.node === deletedEdge.source &&
						edge.from.port === deletedEdge.sourceHandle &&
						edge.to.node === deletedEdge.target &&
						edge.to.port === deletedEdge.targetHandle
					);
				})
			};
			
			// Update edges state
			edges = edges.filter(e => !deletedEdges.some(de => de.id === e.id));
			graphModified = true;
		}

		// Remove deleted nodes from graph
		if (deletedNodes.length > 0) {
			const deletedNodeIds = new Set(deletedNodes.map(n => n.id));
			graph = {
				nodes: graph.nodes.filter(n => !deletedNodeIds.has(n.id)),
				edges: graph.edges.filter(e => !deletedNodeIds.has(e.from.node) && !deletedNodeIds.has(e.to.node))
			};
			
			// Update visualization states
			nodes = nodes.filter(n => !deletedNodeIds.has(n.id));
			edges = edges.filter(e => !deletedNodeIds.has(e.source) && !deletedNodeIds.has(e.target));
			graphModified = true;
		}

		if (graphModified) {
			// Do nothing - graph is already updated
		}
	}

	/**
	 * Update visualization while preserving node positions
	 * Used when graph structure changes but layout should remain the same
	 */
	function updateVisualizationPreservingPositions() {
		if (!graph) return;

		// Update flow while preserving existing node positions
		const flow = updateFlowWithPreservedPositions(graph, nodes, handleNodeDoubleClick, handleNodeEdit, nodeValues);
		nodes = flow.nodes;
		edges = flow.edges;
	}
	
	/**
	 * Handle node values update from CEL Console
	 */
	function handleNodeValuesUpdate(values: Map<string, any>) {
		nodeValues = values;
		// Update the visualization to show the new values
		updateVisualizationPreservingPositions();
	}

</script>

<div class="container">
	{#if isLoading}
		<div class="loading">Loading graph...</div>
	{:else if error}
		<div class="error">Error: {error}</div>
	{:else}
		<!-- Toolbar -->
		<div class="toolbar">
			<div class="toolbar-title">CEL Expression Graph</div>
		</div>

		<!-- Breadcrumb navigation -->
		{#if breadcrumbs.length > 1}
			<Breadcrumbs breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />
		{/if}

		<div class="main-content">
			<!-- Left side: Graph visualization (50%) -->
			<div class="graph-panel">
				<div class="flow">
					<SvelteFlow 
						{nodes} 
						{edges} 
						{nodeTypes} 
						fitView
						elementsSelectable={true}
						deleteKey="Backspace"
						onpaneclick={handlePaneClick}
						onconnect={handleConnect}
						ondelete={handleDelete}
					>
						<Background />
						<Controls />
					</SvelteFlow>
				</div>
			</div>

			<!-- Right side: Data panel (50%) -->
			<div class="data-panel">
				<!-- Sample Graphs List -->
				<SampleGraphsPanel selectedGraph={selectedGraph} onGraphChange={handleGraphChangeFromPanel} />

				<!-- Node List -->
				<NodeListPanel />

				<!-- CEL Console -->
				{#if currentGraph}
					<div class="collapsible-section">
						<div class="section-header">CEL Console</div>
						<div class="section-content">
							<CELConsole graph={currentGraph} inputData={{}} onNodeValuesUpdate={handleNodeValuesUpdate} />
						</div>
					</div>
				{/if}

				<!-- Graph JSON -->
				{#if graph}
					<div class="collapsible-section">
						<div class="section-header">Graph JSON</div>
						<div class="section-content">
							<pre class="json-display">{JSON.stringify(graph, null, 2)}</pre>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Add Node Modal -->
	<AddNodeModal 
		isOpen={showAddNodeModal} 
		onClose={() => showAddNodeModal = false}
		onAddNode={handleAddNode}
	/>

	<!-- Edit Node Modal -->
	<NodeEditModal
		isOpen={showEditNodeModal}
		node={editingNode}
		onClose={() => {
			showEditNodeModal = false;
			editingNode = null;
		}}
		onSave={handleNodeEditSave}
	/>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		background: #1e1e1e;
		color: #cccccc;
		height: 100%;
		/* Fix iOS viewport height issues with dynamic toolbars */
		height: -webkit-fill-available;
	}

	:global(html) {
		height: 100%;
		/* Fix iOS viewport height issues with dynamic toolbars */
		height: -webkit-fill-available;
	}

	:global(#svelte-app) {
		height: 100vh;
		width: 100vw;
		/* Fix iOS viewport height issues */
		height: -webkit-fill-available;
	}

	/* VS Code color variables */
	:global(:root) {
		--vscode-bg: #1e1e1e;
		--vscode-sidebar-bg: #252526;
		--vscode-editor-bg: #1e1e1e;
		--vscode-toolbar-bg: #333333;
		--vscode-border: #3c3c3c;
		--vscode-text: #cccccc;
		--vscode-text-muted: #858585;
		--vscode-accent: #007acc;
		--vscode-accent-hover: #005a9e;
		--vscode-success: #4ec9b0;
		--vscode-error: #f48771;
		--vscode-warning: #dcdcaa;
	}

	.container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--vscode-bg);
	}
	
	/* Desktop: fixed height for split view */
	@media (min-width: 768px) {
		.container {
			/* Ensure proper height on iOS */
			min-height: 100vh;
			min-height: -webkit-fill-available;
		}
	}
	
	/* Mobile: allow container to grow beyond viewport */
	@media (max-width: 767px) {
		.container {
			height: auto;
			min-height: 100vh;
		}
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		background: var(--vscode-toolbar-bg);
		border-bottom: 1px solid var(--vscode-border);
		flex-shrink: 0;
		height: 48px;
		/* Ensure toolbar is visible on iOS below status bar */
		position: relative;
		z-index: 10;
	}

	.toolbar-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--vscode-text);
	}

	.toolbar-actions {
		display: flex;
		gap: 0.5rem;
	}

	.toolbar-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: var(--vscode-accent);
		color: white;
		border: none;
		border-radius: 2px;
		font-size: 0.813rem;
		cursor: pointer;
		transition: background 0.2s;
		font-family: inherit;
	}

	.toolbar-btn:hover {
		background: var(--vscode-accent-hover);
	}

	.btn-icon {
		font-size: 0.75rem;
	}

	.loading,
	.error {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		font-size: 1.5rem;
		color: var(--vscode-text);
	}

	.error {
		color: var(--vscode-error);
	}

	.main-content {
		display: flex;
		flex: 1;
		min-height: 0;
		flex-direction: column;
		/* Mobile: allow scrolling, no overflow hidden */
		overflow: visible;
	}
	
	/* Desktop: prevent overflow */
	@media (min-width: 768px) {
		.main-content {
			overflow: hidden;
			flex-direction: row;
		}
	}

	/* Mobile-first: Single column layout */
	.graph-panel {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		height: 400px;
		background: var(--vscode-editor-bg);
		border-bottom: 1px solid var(--vscode-border);
		/* Allow touch interactions on iOS */
		touch-action: manipulation;
	}
	
	/* Desktop: full height */
	@media (min-width: 768px) {
		.graph-panel {
			flex: 0 0 50%;
			height: auto;
			min-height: 0;
			border-bottom: none;
			border-right: 1px solid var(--vscode-border);
		}
	}

	.data-panel {
		flex: 1 1 auto;
		background: var(--vscode-sidebar-bg);
		/* Mobile: no internal scroll, part of page scroll */
		overflow: visible;
		/* Prevent scroll chaining on iOS */
		overscroll-behavior: contain;
	}
	
	/* Desktop: internal scroll */
	@media (min-width: 768px) {
		.data-panel {
			overflow-y: auto;
			flex: 0 0 50%;
		}
	}

	.flow {
		flex: 1;
		min-height: 0;
		/* Ensure SvelteFlow can handle touch properly on iOS */
		position: relative;
	}

	/* Collapsible sections in data panel */
	.collapsible-section {
		border-bottom: 1px solid var(--vscode-border);
	}

	.section-header {
		padding: 0.75rem 1rem;
		background: #2d2d30;
		color: var(--vscode-text);
		font-size: 0.875rem;
		font-weight: 600;
		border-bottom: 1px solid var(--vscode-border);
	}

	.section-content {
		padding: 1rem;
	}

	.result-status {
		padding: 0.5rem 0.75rem;
		border-radius: 3px;
		font-weight: 600;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
	}

	.result-status.success {
		background: rgba(78, 201, 176, 0.2);
		color: var(--vscode-success);
		border: 1px solid var(--vscode-success);
	}

	.result-status.failure {
		background: rgba(244, 135, 113, 0.2);
		color: var(--vscode-error);
		border: 1px solid var(--vscode-error);
	}

	.error-list,
	.warning-list {
		margin-top: 0.75rem;
	}

	.error-list h4,
	.warning-list h4 {
		margin-bottom: 0.5rem;
		font-size: 0.813rem;
		color: var(--vscode-text);
	}

	.error-item {
		padding: 0.5rem;
		background: rgba(244, 135, 113, 0.1);
		color: var(--vscode-error);
		border-left: 3px solid var(--vscode-error);
		margin-bottom: 0.5rem;
		font-size: 0.813rem;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
	}

	.warning-item {
		padding: 0.5rem;
		background: rgba(220, 220, 170, 0.1);
		color: var(--vscode-warning);
		border-left: 3px solid var(--vscode-warning);
		margin-bottom: 0.5rem;
		font-size: 0.813rem;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
	}

	.inferred-types {
		margin-top: 0.75rem;
	}

	.inferred-types h4 {
		margin-bottom: 0.5rem;
		font-size: 0.813rem;
		color: var(--vscode-text);
	}

	.json-display {
		background: #1e1e1e;
		color: #d4d4d4;
		padding: 1rem;
		border-radius: 3px;
		overflow-x: auto;
		font-size: 0.813rem;
		line-height: 1.5;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		border: 1px solid var(--vscode-border);
	}

	/* Override SvelteFlow styles for dark theme */
	:global(.svelte-flow) {
		background: var(--vscode-editor-bg) !important;
	}

	:global(.svelte-flow__background) {
		--xy-background-color-default: var(--vscode-editor-bg);
		--xy-background-pattern-color-default: #2d2d30;
	}

	:global(.svelte-flow__controls) {
		background: var(--vscode-sidebar-bg);
		border: 1px solid var(--vscode-border);
	}

	:global(.svelte-flow__controls button) {
		background: var(--vscode-sidebar-bg);
		border-bottom: 1px solid var(--vscode-border);
		color: var(--vscode-text);
	}

	:global(.svelte-flow__controls button:hover) {
		background: #3e3e42;
	}

	:global(.svelte-flow__edge-path) {
		stroke: var(--vscode-accent);
	}
</style>
