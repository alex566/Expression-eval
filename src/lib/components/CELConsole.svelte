<script lang="ts">
	import type { Graph } from '$lib/dataflow/types';
	import { QuickJSGraphEvaluator } from '$lib/dataflow/quickjs-evaluator';
	import { onMount } from 'svelte';
	
	let { 
		graph, 
		inputData = {},
		onNodeValuesUpdate
	}: { 
		graph: Graph; 
		inputData?: any;
		onNodeValuesUpdate?: (nodeValues: Map<string, any>) => void;
	} = $props();
	
	let jsCode = $state('');
	let evaluationResult: any = $state(null);
	let error = $state('');
	let isEvaluating = $state(false);
	let inputDataStr = $state(JSON.stringify(inputData, null, 2));
	
	// Load sample input data on mount
	let loadError = $state('');
	
	onMount(async () => {
		try {
			const response = await fetch('/sample-input.json');
			if (!response.ok) {
				throw new Error(`Failed to load sample data: ${response.statusText}`);
			}
			const sampleData = await response.json();
			inputDataStr = JSON.stringify(sampleData, null, 2);
			loadError = '';
		} catch (err) {
			// Store error but don't block the UI - user can still enter custom input
			loadError = err instanceof Error ? err.message : 'Failed to load sample input data';
			console.warn('Could not load sample input data:', err);
		}
	});
	
	// Compile to JavaScript code
	function compileToJS() {
		try {
			const evaluator = new QuickJSGraphEvaluator(graph);
			jsCode = evaluator.compile();
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
	}
	
	// Evaluate with input data
	async function evaluateJS() {
		try {
			isEvaluating = true;
			
			// Parse input JSON string
			let parsedInput = inputData;
			try {
				parsedInput = JSON.parse(inputDataStr);
			} catch (e) {
				error = 'Invalid JSON input';
				isEvaluating = false;
				return;
			}
			
			const evaluator = new QuickJSGraphEvaluator(graph);
			const result = await evaluator.evaluate(parsedInput);
			
			if (result.success) {
				evaluationResult = result.outputs.result;
				error = '';
				
				// Pass node values to parent if callback is provided
				if (onNodeValuesUpdate && result.nodeValues) {
					onNodeValuesUpdate(result.nodeValues);
				}
			} else {
				error = result.error || 'Evaluation failed';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			isEvaluating = false;
		}
	}
	
	// Auto-compile when graph changes
	$effect(() => {
		if (graph) {
			compileToJS();
		}
	});
	
	function formatJSON(value: any): string {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}
</script>

<div class="js-console">
	<div class="js-header">
		<h3>JavaScript Expression Console</h3>
		<button 
			class="compile-btn" 
			onclick={compileToJS}
			title="Recompile graph to JavaScript"
		>
			🔄 Compile
		</button>
	</div>
	
	<div class="js-expression-section">
		<h4>Compiled JavaScript Code:</h4>
		<div class="code-block">
			{jsCode || 'No code compiled yet'}
		</div>
	</div>
	
	<div class="input-section">
		<h4>Input Data (JSON):</h4>
		<textarea 
			bind:value={inputDataStr}
			placeholder="{`{\"key\": \"value\"}`}"
			rows={6}
		></textarea>
	</div>
	
	<div class="actions">
		<button 
			class="evaluate-btn" 
			onclick={evaluateJS}
			disabled={isEvaluating || !jsCode}
		>
			{isEvaluating ? '⏳ Evaluating...' : '▶️ Evaluate'}
		</button>
	</div>
	
	{#if error}
		<div class="error-section">
			<h4>❌ Error</h4>
			<div class="error-message">{error}</div>
		</div>
	{/if}
	
	{#if evaluationResult !== null}
		<div class="result-section">
			<h4>✅ Result (JSON):</h4>
			<div class="code-block result">
				{formatJSON(evaluationResult)}
			</div>
		</div>
	{/if}
</div>

<style>
	.js-console {
		background: #1e293b;
		color: #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
		font-family: 'Courier New', Courier, monospace;
	}
	
	.js-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #0f172a;
		border-bottom: 1px solid #334155;
	}
	
	h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #f1f5f9;
	}
	
	h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.compile-btn {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 600;
		transition: background 0.2s;
		/* iOS Safari fixes for button interactions */
		-webkit-tap-highlight-color: rgba(59, 130, 246, 0.3);
		touch-action: manipulation;
		-webkit-user-select: none;
		user-select: none;
	}
	
	.compile-btn:hover {
		background: #2563eb;
	}
	
	.compile-btn:active {
		background: #1d4ed8;
	}
	
	.js-expression-section,
	.input-section,
	.result-section,
	.error-section {
		padding: 1rem;
		border-bottom: 1px solid #334155;
	}
	
	.code-block {
		background: #0f172a;
		padding: 1rem;
		border-radius: 0.375rem;
		border: 1px solid #334155;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
		font-size: 0.875rem;
		line-height: 1.5;
		color: #10b981;
	}
	
	.code-block.result {
		color: #60a5fa;
	}
	
	textarea {
		width: 100%;
		padding: 0.75rem;
		background: #0f172a;
		color: #e2e8f0;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.875rem;
		resize: vertical;
	}
	
	textarea:focus {
		outline: none;
		border-color: #3b82f6;
	}
	
	.actions {
		padding: 1rem;
		display: flex;
		gap: 0.5rem;
	}
	
	.evaluate-btn {
		flex: 1;
		padding: 0.75rem 1.5rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: background 0.2s;
		/* iOS Safari fixes for button interactions */
		-webkit-tap-highlight-color: rgba(16, 185, 129, 0.3);
		touch-action: manipulation;
		-webkit-user-select: none;
		user-select: none;
	}
	
	.evaluate-btn:hover:not(:disabled) {
		background: #059669;
	}
	
	.evaluate-btn:active:not(:disabled) {
		background: #047857;
	}
	
	.evaluate-btn:disabled {
		background: #475569;
		cursor: not-allowed;
	}
	
	.error-section {
		background: #7f1d1d;
		border-color: #991b1b;
	}
	
	.error-message {
		margin-top: 0.5rem;
		padding: 0.75rem;
		background: #450a0a;
		color: #fca5a5;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}
</style>
