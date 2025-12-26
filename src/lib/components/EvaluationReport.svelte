<script lang="ts">
	import type { EvaluationResult, Graph } from '$lib/dataflow/types';

	export let result: EvaluationResult;
	export let graph: Graph;

	interface NodeReport {
		id: string;
		type: string;
		inputs: { port: string; value: any; type: string }[];
		outputs: { port: string; value: any; type: string }[];
	}

	// Build a structured report from the evaluation result
	$: nodeReports = buildNodeReports(result, graph);
	$: finalOutputs = extractFinalOutputs(result, graph);

	function buildNodeReports(result: EvaluationResult, graph: Graph): NodeReport[] {
		if (!result.success || !result.outputs) return [];

		const reports: NodeReport[] = [];

		for (const node of graph.nodes) {
			const inputs: { port: string; value: any; type: string }[] = [];
			const outputs: { port: string; value: any; type: string }[] = [];

			// Collect inputs
			for (const key in result.outputs) {
				if (key.startsWith(`${node.id}.input.`)) {
					const port = key.replace(`${node.id}.input.`, '');
					const value = result.outputs[key];
					const typeInfo = result.inferredTypes?.[key];
					inputs.push({
						port,
						value,
						type: typeInfo?.inferredType || 'unknown'
					});
				}
			}

			// Collect outputs (excluding input ports)
			// Output keys follow the pattern: nodeId.portName
			// Input keys follow the pattern: nodeId.input.portName
			for (const key in result.outputs) {
				if (key.startsWith(`${node.id}.`) && !key.includes('.input.')) {
					const port = key.replace(`${node.id}.`, '');
					const value = result.outputs[key];
					const typeInfo = result.inferredTypes?.[key];
					outputs.push({
						port,
						value,
						type: typeInfo?.inferredType || 'unknown'
					});
				}
			}

			// Only add nodes that have inputs or outputs
			if (inputs.length > 0 || outputs.length > 0) {
				reports.push({
					id: node.id,
					type: node.type,
					inputs,
					outputs
				});
			}
		}

		return reports;
	}

	function extractFinalOutputs(result: EvaluationResult, graph: Graph): { name: string; value: any; type: string }[] {
		if (!result.success || !result.outputs) return [];

		const finals: { name: string; value: any; type: string }[] = [];

		// Find Output nodes
		const outputNodes = graph.nodes.filter(n => n.type === 'Output');

		for (const outputNode of outputNodes) {
			// Get the output port names from the node's data
			// If outputs is not defined or empty, skip this node rather than assume a default
			const outputNames = outputNode.data.outputs;
			if (!outputNames || !Array.isArray(outputNames) || outputNames.length === 0) {
				continue;
			}
			
			for (const outputName of outputNames) {
				const key = `${outputNode.id}.${outputName}`;
				if (key in result.outputs) {
					const value = result.outputs[key];
					const typeInfo = result.inferredTypes?.[key];
					finals.push({
						name: outputName,
						value,
						type: typeInfo?.inferredType || 'unknown'
					});
				}
			}
		}

		return finals;
	}

	function formatValue(value: any): string {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';
		if (typeof value === 'object') {
			return JSON.stringify(value, null, 2);
		}
		return String(value);
	}
</script>

<div class="evaluation-report">
	<h3>Evaluation Report</h3>

	{#if !result.success}
		<div class="error-section">
			<h4>❌ Evaluation Failed</h4>
			{#if result.error}
				<div class="error-message">{result.error}</div>
			{/if}
		</div>
	{:else}
		<!-- Summary Section -->
		<div class="summary-section">
			<h4>✅ Evaluation Successful</h4>
			
			{#if finalOutputs.length > 0}
				<div class="final-results">
					<h5>Final Result{finalOutputs.length > 1 ? 's' : ''}:</h5>
					{#each finalOutputs as output}
						<div class="final-output">
							<span class="output-name">{output.name}</span>
							<span class="output-type">({output.type})</span>
							<span class="output-value">{formatValue(output.value)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Node Execution Details -->
		<div class="nodes-section">
			<h4>Node Execution Details</h4>
			
			{#each nodeReports as nodeReport}
				<div class="node-report">
					<div class="node-header">
						<span class="node-type">{nodeReport.type}</span>
						<span class="node-id">({nodeReport.id})</span>
					</div>

					<div class="node-details">
						{#if nodeReport.inputs.length > 0}
							<div class="inputs-section">
								<div class="section-label">Inputs:</div>
								<div class="ports">
									{#each nodeReport.inputs as input}
										<div class="port-item">
											<span class="port-name">{input.port}</span>
											<span class="port-type">{input.type}</span>
											<span class="port-arrow">→</span>
											<span class="port-value">{formatValue(input.value)}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if nodeReport.outputs.length > 0}
							<div class="outputs-section">
								<div class="section-label">Outputs:</div>
								<div class="ports">
									{#each nodeReport.outputs as output}
										<div class="port-item">
											<span class="port-name">{output.port}</span>
											<span class="port-type">{output.type}</span>
											<span class="port-arrow">→</span>
											<span class="port-value">{formatValue(output.value)}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.evaluation-report {
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	h3 {
		margin: 0;
		padding: 1rem;
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
		font-size: 1.125rem;
		font-weight: 600;
	}

	h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	h5 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #4b5563;
	}

	.error-section {
		padding: 1rem;
		background: #fef2f2;
	}

	.error-message {
		margin-top: 0.5rem;
		padding: 0.75rem;
		background: #fee2e2;
		color: #991b1b;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.summary-section {
		padding: 1rem;
		background: #f0fdf4;
		border-bottom: 1px solid #e5e7eb;
	}

	.final-results {
		margin-top: 1rem;
		padding: 1rem;
		background: white;
		border-radius: 0.375rem;
		border: 2px solid #10b981;
	}

	.final-output {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		margin-bottom: 0.25rem;
		background: #f9fafb;
		border-radius: 0.25rem;
	}

	.final-output:last-child {
		margin-bottom: 0;
	}

	.output-name {
		font-weight: 600;
		color: #1f2937;
	}

	.output-type {
		font-size: 0.75rem;
		color: #6b7280;
		font-family: monospace;
	}

	.output-value {
		margin-left: auto;
		padding: 0.25rem 0.5rem;
		background: #10b981;
		color: white;
		border-radius: 0.25rem;
		font-weight: 600;
		font-size: 1.125rem;
	}

	.nodes-section {
		padding: 1rem;
	}

	.node-report {
		margin-bottom: 1rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 0.375rem;
		border: 1px solid #e5e7eb;
	}

	.node-report:last-child {
		margin-bottom: 0;
	}

	.node-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.node-type {
		font-weight: 600;
		color: #1f2937;
		font-size: 0.9375rem;
	}

	.node-id {
		font-size: 0.875rem;
		color: #6b7280;
		font-family: monospace;
	}

	.node-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #4b5563;
		margin-bottom: 0.375rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.ports {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.port-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: white;
		border-radius: 0.25rem;
		border: 1px solid #e5e7eb;
		font-size: 0.875rem;
	}

	.port-name {
		font-weight: 600;
		color: #1f2937;
		font-family: monospace;
	}

	.port-type {
		font-size: 0.75rem;
		color: #3b82f6;
		font-family: monospace;
		background: #eff6ff;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.port-arrow {
		color: #9ca3af;
		margin: 0 0.25rem;
	}

	.port-value {
		font-family: monospace;
		color: #059669;
		font-weight: 600;
		margin-left: auto;
	}

	.inputs-section {
		background: #fef3c7;
		padding: 0.75rem;
		border-radius: 0.375rem;
	}

	.outputs-section {
		background: #dbeafe;
		padding: 0.75rem;
		border-radius: 0.375rem;
	}
</style>
