<script lang="ts">
	import { nodeRegistry } from '$lib/dataflow/registry';
	import type { NodeDefinition } from '$lib/dataflow/types';

	export let isOpen = false;
	export let onClose: () => void;
	export let onAddNode: (nodeType: string, nodeData: Record<string, any>) => void;

	let selectedNode: NodeDefinition | null = null;
	let nodeData: Record<string, any> = {};
	let selectedCategory = 'all';
	let allNodes: NodeDefinition[] = [];
	let categories: string[] = [];

	// Update nodes when modal opens
	$: if (isOpen) {
		allNodes = nodeRegistry.getAll();
		categories = Array.from(
			new Set(allNodes.map((node) => node.category))
		).sort();
	}

	$: filteredNodes =
		selectedCategory === 'all'
			? allNodes
			: allNodes.filter(node => node.category === selectedCategory);

	function selectNode(node: NodeDefinition) {
		selectedNode = node;
		nodeData = {};
	}

	function handleAddNode() {
		if (!selectedNode) return;

		onAddNode(selectedNode.type, nodeData);
		resetModal();
	}

	function resetModal() {
		selectedNode = null;
		nodeData = {};
		onClose();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			resetModal();
		}
	}
</script>

{#if isOpen}
	<div class="modal-backdrop" on:click={handleBackdropClick} role="presentation">
		<div class="modal" on:click={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
			<div class="modal-header">
				<h2>Add New Node</h2>
				<button class="close-btn" on:click={resetModal} aria-label="Close">&times;</button>
			</div>

			<div class="modal-content">
				{#if !selectedNode}
					<!-- Node Selection -->
					<div class="category-filter">
						<label for="category">Category:</label>
						<select id="category" bind:value={selectedCategory}>
							<option value="all">All</option>
							{#each categories as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
					</div>

					<div class="node-list">
						{#each filteredNodes as node}
							<div 
								class="node-item" 
								on:click={() => selectNode(node)}
								on:keydown={(e) => e.key === 'Enter' && selectNode(node)} 
								role="button" 
								tabindex="0"
							>
								<div class="node-item-header">
									<span class="node-type">{node.type}</span>
									<span class="node-category">{node.category}</span>
								</div>
								{#if node.description}
									<div class="node-description">{node.description}</div>
								{/if}
								<div class="node-ports">
									{#if node.inputs && node.inputs.length > 0}
										<div class="ports-info">
											<strong>Inputs:</strong>
											{node.inputs.map((p) => `${p.name} (${p.type})`).join(', ')}
										</div>
									{/if}
									{#if node.outputs && node.outputs.length > 0}
										<div class="ports-info">
											<strong>Outputs:</strong>
											{node.outputs.map((p) => `${p.name} (${p.type})`).join(', ')}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<!-- Node Configuration -->
					<div class="node-config">
						<h3>Configure {selectedNode.type}</h3>
						{#if selectedNode.description}
							<p class="config-description">{selectedNode.description}</p>
						{/if}

						<div class="config-fields">
							{#if selectedNode.type === 'Value'}
								<label>
									<span>Value:</span>
									<input
										type="text"
										bind:value={nodeData.value}
										placeholder="Enter value (number, string, etc.)"
									/>
								</label>
							{:else if selectedNode.type === 'Output'}
								<label>
									<span>Output Names (comma-separated):</span>
									<input
										type="text"
										bind:value={nodeData.outputNames}
										placeholder="result, output, etc."
									/>
								</label>
							{:else if selectedNode.type === 'Compare'}
								<label>
									<span>Operator:</span>
									<select bind:value={nodeData.operator}>
										<option value="==">== (Equal)</option>
										<option value="===">=== (Strict Equal)</option>
										<option value="!=">!= (Not Equal)</option>
										<option value="!==">!== (Strict Not Equal)</option>
										<option value=">">&gt; (Greater Than)</option>
										<option value=">=">&gt;= (Greater or Equal)</option>
										<option value="<">&lt; (Less Than)</option>
										<option value="<=">&lt;= (Less or Equal)</option>
									</select>
								</label>
							{/if}
						</div>

						<div class="config-actions">
							<button class="btn-secondary" on:click={() => (selectedNode = null)}>Back</button>
							<button class="btn-primary" on:click={handleAddNode}>Add Node</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 8px;
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		color: #1a192b;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 2rem;
		cursor: pointer;
		color: #64748b;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.close-btn:hover {
		background: #f3f4f6;
		color: #1a192b;
	}

	.modal-content {
		overflow-y: auto;
		padding: 1.5rem;
		flex: 1;
	}

	.category-filter {
		margin-bottom: 1rem;
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.category-filter label {
		font-weight: 600;
		color: #374151;
	}

	.category-filter select {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.node-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.node-item {
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.node-item:hover {
		border-color: #3b82f6;
		background: #eff6ff;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
	}

	.node-item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.node-type {
		font-weight: 600;
		font-size: 1rem;
		color: #1a192b;
	}

	.node-category {
		font-size: 0.75rem;
		color: white;
		background: #3b82f6;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		text-transform: uppercase;
	}

	.node-description {
		font-size: 0.875rem;
		color: #64748b;
		margin-bottom: 0.5rem;
	}

	.node-ports {
		font-size: 0.75rem;
		color: #64748b;
	}

	.ports-info {
		margin-top: 0.25rem;
	}

	.node-config h3 {
		margin-top: 0;
		margin-bottom: 0.5rem;
		color: #1a192b;
	}

	.config-description {
		color: #64748b;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.config-fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.config-fields label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.config-fields label span {
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}

	.config-fields input,
	.config-fields select {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.config-fields input:focus,
	.config-fields select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.config-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}
</style>
