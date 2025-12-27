<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteFlow, Controls, Background, type Node, type Edge, type Connection } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import type { Graph, EvaluationResult, ValidationResult, GraphNode, GraphEdge } from '$lib/dataflow/types';
	import { GraphEvaluator } from '$lib/dataflow/evaluator';
	import { nodeRegistry } from '$lib/dataflow/registry';
	import { registerAllNodes } from '$lib/nodes';
	import { graphToSvelteFlow, updateFlowWithPreservedPositions } from '$lib/utils/graph-converter';
	import CustomNode from '$lib/components/CustomNode.svelte';
	import EvaluationReport from '$lib/components/EvaluationReport.svelte';
	import AddNodeModal from '$lib/components/AddNodeModal.svelte';
	import { GRAPHS } from '$lib/data/graphs';

	let nodes = $state.raw<Node[]>([]);
	let edges = $state.raw<Edge[]>([]);
	let graph: Graph | null = $state(null);
	let validationResult: ValidationResult | null = $state(null);
	let evaluationResult: EvaluationResult | null = $state(null);
	let isLoading = $state(true);
	let error = $state('');
	let selectedGraph = $state('sample');
	let showAddNodeModal = $state(false);

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

			// Reset results when loading new graph
			validationResult = null;
			evaluationResult = null;

			// Convert to SvelteFlow format
			const flow = graphToSvelteFlow(graph);
			nodes = flow.nodes;
			edges = flow.edges;

			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
	}

	function handleGraphChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedGraph = target.value;
		loadGraph(selectedGraph);
	}

	async function validateGraph() {
		if (!graph) {
			error = 'No graph loaded';
			return;
		}

		try {
			const evaluator = new GraphEvaluator(graph, nodeRegistry);
			validationResult = await evaluator.validate();
			error = '';

			// Update nodes with inferred types for visualization
			// Preserve existing positions - only update node data, not layout
			if (validationResult.success && validationResult.inferredTypes && graph) {
				const flow = updateFlowWithPreservedPositions(graph, nodes, validationResult.inferredTypes);
				nodes = flow.nodes;
				edges = flow.edges;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
	}

	async function evaluateGraph() {
		if (!graph) {
			error = 'No graph loaded';
			return;
		}

		try {
			const evaluator = new GraphEvaluator(graph, nodeRegistry);
			evaluationResult = await evaluator.evaluate();
			error = '';

			// Update nodes with inferred types for visualization
			// Preserve existing positions - only update node data, not layout
			if (evaluationResult.success && evaluationResult.inferredTypes && graph) {
				const flow = updateFlowWithPreservedPositions(graph, nodes, evaluationResult.inferredTypes);
				nodes = flow.nodes;
				edges = flow.edges;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
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
		const flow = graphToSvelteFlow(graph);
		nodes = flow.nodes;
		edges = flow.edges;
		
		validationResult = null;
		evaluationResult = null;
		showAddNodeModal = false;
	}

	function handleConnect(connection: Connection) {
		if (!graph) return;

		// Create new edge
		const newEdge: GraphEdge = {
			from: {
				node: connection.source,
				port: connection.sourceHandle ?? 'out'
			},
			to: {
				node: connection.target,
				port: connection.targetHandle ?? 'in'
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
			// Reset validation and evaluation results when graph changes
			validationResult = null;
			evaluationResult = null;
		}
	}

	/**
	 * Update visualization while preserving node positions
	 * Used when graph structure changes but layout should remain the same
	 */
	function updateVisualizationPreservingPositions() {
		if (!graph) return;

		// Reset validation and evaluation results when graph changes
		validationResult = null;
		evaluationResult = null;

		// Update flow while preserving existing node positions
		const flow = updateFlowWithPreservedPositions(graph, nodes);
		nodes = flow.nodes;
		edges = flow.edges;
	}

</script>

<div class="container">
	{#if isLoading}
		<div class="loading">Loading graph...</div>
	{:else if error}
		<div class="error">Error: {error}</div>
	{:else}
		<!-- Toolbar with graph picker -->
		<div class="toolbar">
			<div class="graph-selector">
				<label for="graph-select">Load Graph:</label>
				<select id="graph-select" bind:value={selectedGraph} onchange={handleGraphChange}>
					<option value="sample">Sample Graph</option>
					<option value="complex">Complex Graph</option>
					<option value="dates">Date Operations</option>
					<option value="arrays">Array Operations</option>
				</select>
			</div>
			<div class="toolbar-buttons">
				<button onclick={validateGraph}>Validate Graph</button>
				<button onclick={evaluateGraph}>Evaluate Graph</button>
			</div>
		</div>

		<div class="content">
			<!-- Graph visualization -->
			<div class="graph-container">
				<h2>Graph Visualization</h2>
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

			<!-- Output information -->
			<div class="sidebar">

				{#if validationResult}
					<div class="results">
						<h3>Validation Result</h3>
						<div class="result-status" class:success={validationResult.success} class:failure={!validationResult.success}>
							Status: {validationResult.success ? 'Valid' : 'Invalid'}
						</div>

						{#if validationResult.errors.length > 0}
							<div class="error-list">
								<h4>Errors:</h4>
								{#each validationResult.errors as err}
									<div class="error-item">{err}</div>
								{/each}
							</div>
						{/if}

						{#if validationResult.warnings.length > 0}
							<div class="warning-list">
								<h4>Warnings:</h4>
								{#each validationResult.warnings as warn}
									<div class="warning-item">{warn}</div>
								{/each}
							</div>
						{/if}

						{#if validationResult.success && validationResult.inferredTypes && Object.keys(validationResult.inferredTypes).length > 0}
							<h4>Inferred Types:</h4>
							<pre>{JSON.stringify(validationResult.inferredTypes, null, 2)}</pre>
						{/if}
					</div>
				{/if}

				{#if evaluationResult && graph}
					<div class="results">
						<EvaluationReport result={evaluationResult} {graph} />
					</div>
				{/if}

				{#if graph}
					<div class="graph-json">
						<h3>Graph JSON</h3>
						<pre>{JSON.stringify(graph, null, 2)}</pre>
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
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: system-ui, -apple-system, sans-serif;
	}

	:global(html) {
		height: 100%;
	}

	:global(#svelte-app) {
		height: 100vh;
		width: 100vw;
	}

	.container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: #f3f4f6;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
	}

	.toolbar-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.toolbar-buttons button {
		flex: 1;
		margin-bottom: 0;
	}

	/* Mobile-first: stack toolbar elements */
	@media (min-width: 640px) {
		.toolbar {
			flex-direction: row;
			align-items: center;
		}

		.toolbar .graph-selector {
			flex: 1;
			margin-bottom: 0;
		}

		.toolbar-buttons {
			flex-shrink: 0;
		}

		.toolbar-buttons button {
			width: auto;
			padding: 0.5rem 1rem;
		}
	}

	.loading,
	.error {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		font-size: 1.5rem;
	}

	.error {
		color: #dc2626;
	}

	.content {
		display: flex;
		flex: 1;
		overflow: hidden;
		flex-direction: column;
		min-height: 0;
	}

	.graph-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 300px;
	}

	.graph-container h2 {
		margin: 0;
		padding: 1rem;
		background: #f3f4f6;
		border-bottom: 1px solid #e5e7eb;
		display: none;
	}

	.flow {
		flex: 1;
		min-height: 300px;
	}

	.sidebar {
		width: 100%;
		background: #f9fafb;
		border-top: 1px solid #e5e7eb;
		overflow-y: auto;
		padding: 1rem;
		flex-shrink: 0;
	}

	/* Desktop layout */
	@media (min-width: 768px) {
		.content {
			flex-direction: row;
		}

		.graph-container {
			min-height: 0;
		}

		.graph-container h2 {
			display: block;
		}

		.flow {
			min-height: 0;
		}

		.sidebar {
			width: 400px;
			border-top: none;
			border-left: 1px solid #e5e7eb;
		}
	}

	.sidebar h3,
	.sidebar h4 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.graph-selector {
		margin-bottom: 0.5rem;
		padding: 0.75rem;
		background: white;
		border-radius: 0.375rem;
		border: 1px solid #e5e7eb;
	}

	.toolbar .graph-selector {
		margin-bottom: 0;
	}

	.graph-selector label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #374151;
	}

	.graph-selector select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		background: white;
		cursor: pointer;
	}

	.graph-selector select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	button {
		width: 100%;
		padding: 0.75rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s;
		margin-bottom: 0.5rem;
	}

	button:hover {
		background: #2563eb;
	}

	.results {
		margin-top: 1.5rem;
		padding: 1rem;
		background: white;
		border-radius: 0.375rem;
		border: 1px solid #e5e7eb;
	}

	.result-status {
		padding: 0.5rem;
		border-radius: 0.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.result-status.success {
		background: #dcfce7;
		color: #166534;
	}

	.result-status.failure {
		background: #fee2e2;
		color: #991b1b;
	}

	.error-list,
	.warning-list {
		margin-top: 0.5rem;
	}

	.error-list h4,
	.warning-list h4 {
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.error-item {
		padding: 0.5rem;
		background: #fee2e2;
		color: #991b1b;
		border-radius: 0.25rem;
		margin-bottom: 0.25rem;
		font-size: 0.875rem;
	}

	.warning-item {
		padding: 0.5rem;
		background: #fef3c7;
		color: #92400e;
		border-radius: 0.25rem;
		margin-bottom: 0.25rem;
		font-size: 0.875rem;
	}

	pre {
		background: #1f2937;
		color: #f3f4f6;
		padding: 1rem;
		border-radius: 0.375rem;
		overflow-x: auto;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.graph-json {
		margin-top: 1.5rem;
		padding: 1rem;
		background: white;
		border-radius: 0.375rem;
		border: 1px solid #e5e7eb;
	}

	.graph-json h3 {
		margin-top: 0;
	}
</style>
