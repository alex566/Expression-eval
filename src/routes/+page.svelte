<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteFlow, Controls, Background, type Node, type Edge } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import type { Graph, EvaluationResult } from '$lib/dataflow/types';
	import { GraphEvaluator } from '$lib/dataflow/evaluator';
	import { nodeRegistry } from '$lib/dataflow/registry';
	import { registerAllNodes } from '$lib/nodes';
	import { graphToSvelteFlow } from '$lib/utils/graph-converter';

	let nodes: Node[] = [];
	let edges: Edge[] = [];
	let graph: Graph | null = null;
	let evaluationResult: EvaluationResult | null = null;
	let isLoading = true;
	let error = '';

	onMount(async () => {
		try {
			// Register all predefined nodes
			registerAllNodes();

			// Load sample graph
			const response = await fetch('/sample-graph.json');
			if (!response.ok) {
				throw new Error('Failed to load sample graph');
			}

			graph = await response.json();

			// Convert to SvelteFlow format
			if (graph) {
				const flow = graphToSvelteFlow(graph);
				nodes = flow.nodes;
				edges = flow.edges;
			}

			isLoading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			isLoading = false;
		}
	});

	async function evaluateGraph() {
		if (!graph) {
			error = 'No graph loaded';
			return;
		}

		try {
			const evaluator = new GraphEvaluator(graph, nodeRegistry);
			evaluationResult = await evaluator.evaluate();
			error = '';
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
					<SvelteFlow {nodes} {edges} fitView>
						<Background />
						<Controls />
					</SvelteFlow>
				</div>
			</div>

			<div class="sidebar">
				<h2>Controls</h2>
				<button onclick={evaluateGraph}>Evaluate Graph</button>

				{#if evaluationResult}
					<div class="results">
						<h3>Evaluation Result</h3>
						<div class="result-status" class:success={evaluationResult.success}>
							Status: {evaluationResult.success ? 'Success' : 'Failed'}
						</div>

						{#if evaluationResult.error}
							<div class="error-message">{evaluationResult.error}</div>
						{/if}

						<h4>Outputs:</h4>
						<pre>{JSON.stringify(evaluationResult.outputs, null, 2)}</pre>
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

	.error-message {
		padding: 0.5rem;
		background: #fee2e2;
		color: #991b1b;
		border-radius: 0.25rem;
		margin-bottom: 0.5rem;
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
