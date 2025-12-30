<script lang="ts">
	import type { Graph } from '$lib/dataflow/types';
	import { CELGraphEvaluator } from '$lib/dataflow/cel-evaluator';
	
	export let graph: Graph;
	export let inputData: any = {};
	
	let celExpression = '';
	let evaluationResult: any = null;
	let error = '';
	let isEvaluating = false;
	let inputDataStr = JSON.stringify(inputData, null, 2);
	
	// Compile to CEL expression
	function compileToCEL() {
		try {
			const evaluator = new CELGraphEvaluator(graph);
			celExpression = evaluator.compile();
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
	}
	
	// Evaluate with input data
	async function evaluateCEL() {
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
			
			const evaluator = new CELGraphEvaluator(graph);
			const result = await evaluator.evaluate(parsedInput);
			
			if (result.success) {
				evaluationResult = result.outputs.result;
				error = '';
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
	$: if (graph) {
		compileToCEL();
	}
	
	function formatJSON(value: any): string {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}
</script>

<div class="cel-console">
	<div class="cel-header">
		<h3>CEL Expression Console</h3>
		<button 
			class="compile-btn" 
			on:click={compileToCEL}
			title="Recompile graph to CEL"
		>
			🔄 Compile
		</button>
	</div>
	
	<div class="cel-expression-section">
		<h4>Compiled CEL Expression:</h4>
		<div class="code-block">
			{celExpression || 'No expression compiled yet'}
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
			on:click={evaluateCEL}
			disabled={isEvaluating || !celExpression}
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
	.cel-console {
		background: #1e293b;
		color: #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
		font-family: 'Courier New', Courier, monospace;
	}
	
	.cel-header {
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
	}
	
	.compile-btn:hover {
		background: #2563eb;
	}
	
	.cel-expression-section,
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
	}
	
	.evaluate-btn:hover:not(:disabled) {
		background: #059669;
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
