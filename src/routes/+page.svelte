<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteFlow, Controls, Background, type Node, type Edge } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import type { Graph, EvaluationResult, ValidationResult } from '$lib/dataflow/types';
	import { GraphEvaluator } from '$lib/dataflow/evaluator';
	import { nodeRegistry } from '$lib/dataflow/registry';
	import { registerAllNodes } from '$lib/nodes';
	import { graphToSvelteFlow } from '$lib/utils/graph-converter';
	import CustomNode from '$lib/components/CustomNode.svelte';
	import EvaluationReport from '$lib/components/EvaluationReport.svelte';

	let nodes: Node[] = [];
	let edges: Edge[] = [];
	let graph: Graph | null = null;
	let validationResult: ValidationResult | null = null;
	let evaluationResult: EvaluationResult | null = null;
	let isLoading = true;
	let error = '';
	let selectedGraph = 'sample-graph.json';

	// Register custom node types for SvelteFlow
	const nodeTypes = {
		custom: CustomNode
	};

	onMount(async () => {
		try {
			// Register all predefined nodes
			registerAllNodes();

			// Load sample graph
			await loadGraph(selectedGraph);

			isLoading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			isLoading = false;
		}
	});

	async function loadGraph(filename: string) {
		try {
			const response = await fetch(`/${filename}`);
			if (!response.ok) {
				throw new Error(`Failed to load ${filename}`);
			}

			graph = await response.json();

			// Reset results when loading new graph
			validationResult = null;
			evaluationResult = null;

			// Convert to SvelteFlow format
			if (graph) {
				const flow = graphToSvelteFlow(graph);
				nodes = flow.nodes;
				edges = flow.edges;
			}
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
	}

	async function handleGraphChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedGraph = target.value;
		await loadGraph(selectedGraph);
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
			if (validationResult.success && validationResult.inferredTypes && graph) {
				const flow = graphToSvelteFlow(graph, validationResult.inferredTypes);
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
			if (evaluationResult.success && evaluationResult.inferredTypes && graph) {
				const flow = graphToSvelteFlow(graph, evaluationResult.inferredTypes);
				nodes = flow.nodes;
				edges = flow.edges;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
	}
</script>

<div class="container">
	{#if isLoading}
		<div class="loading">Loading graph...</div>
	{:else if error}
		<div class="error">Error: {error}</div>
	{:else}
		<div class="content">
			<div class="graph-container">
				<h2>Graph Visualization</h2>
				<div class="flow">
					<SvelteFlow {nodes} {edges} {nodeTypes} fitView>
						<Background />
						<Controls />
					</SvelteFlow>
				</div>
			</div>

			<div class="sidebar">
				<h2>Controls</h2>
				
				<div class="graph-selector">
					<label for="graph-select">Load Graph:</label>
					<select id="graph-select" bind:value={selectedGraph} onchange={handleGraphChange}>
						<option value="sample-graph.json">Sample Graph</option>
						<option value="complex-graph.json">Complex Graph</option>
					</select>
				</div>

				<button onclick={validateGraph}>Validate Graph</button>
				<button onclick={evaluateGraph}>Evaluate Graph</button>

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
		height: 100%;
		overflow: hidden;
	}

	.graph-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.graph-container h2 {
		margin: 0;
		padding: 1rem;
		background: #f3f4f6;
		border-bottom: 1px solid #e5e7eb;
	}

	.flow {
		flex: 1;
		min-height: 0;
	}

	.sidebar {
		width: 400px;
		background: #f9fafb;
		border-left: 1px solid #e5e7eb;
		overflow-y: auto;
		padding: 1rem;
	}

	.sidebar h2,
	.sidebar h3,
	.sidebar h4 {
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.graph-selector {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: white;
		border-radius: 0.375rem;
		border: 1px solid #e5e7eb;
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

	.error-message {
		padding: 0.5rem;
		background: #fee2e2;
		color: #991b1b;
		border-radius: 0.25rem;
		margin-bottom: 0.5rem;
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
