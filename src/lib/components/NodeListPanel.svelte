<script lang="ts">
	import { nodeRegistry } from '$lib/dataflow/registry';
	import type { NodeDefinition } from '$lib/dataflow/types';

	let isExpanded = $state(false);
	
	// Load all nodes and group by category immediately
	const allNodes = nodeRegistry.getAll();
	const nodesByCategory: Record<string, NodeDefinition[]> = {};
	
	allNodes.forEach(node => {
		if (!nodesByCategory[node.category]) {
			nodesByCategory[node.category] = [];
		}
		nodesByCategory[node.category].push(node);
	});

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}
</script>

<div class="node-list-panel">
	<button class="panel-header" onclick={toggleExpanded}>
		<span class="header-title">
			<span class="icon">{isExpanded ? '▼' : '▶'}</span>
			Available Nodes ({allNodes.length})
		</span>
	</button>
	
	{#if isExpanded}
		<div class="panel-content">
			{#each Object.entries(nodesByCategory) as [category, nodes]}
				<div class="category-section">
					<h4 class="category-title">{category}</h4>
					<div class="nodes-grid">
						{#each nodes as node}
							<div class="node-card" title={node.description || ''}>
								<div class="node-name">{node.type}</div>
								{#if node.description}
									<div class="node-desc">{node.description}</div>
								{/if}
								<div class="node-ports-info">
									{#if node.inputs && node.inputs.length > 0}
										<div class="port-count">In: {node.inputs.length}</div>
									{/if}
									{#if node.outputs && node.outputs.length > 0}
										<div class="port-count">Out: {node.outputs.length}</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.node-list-panel {
		border-bottom: 1px solid #3c3c3c;
	}

	.panel-header {
		width: 100%;
		padding: 0.75rem 1rem;
		background: #2d2d30;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: background 0.2s;
		color: #cccccc;
		font-size: 0.875rem;
		font-weight: 600;
		/* iOS Safari fixes for button interactions */
		-webkit-tap-highlight-color: rgba(62, 62, 66, 0.3);
		touch-action: manipulation;
		-webkit-user-select: none;
		user-select: none;
	}

	.panel-header:hover {
		background: #3e3e42;
	}
	
	.panel-header:active {
		background: #4e4e52;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.icon {
		font-size: 0.75rem;
		display: inline-block;
		width: 12px;
	}

	.panel-content {
		padding: 0.75rem;
		background: #252526;
		max-height: 400px;
		overflow-y: auto;
	}

	.category-section {
		margin-bottom: 1rem;
	}

	.category-section:last-child {
		margin-bottom: 0;
	}

	.category-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6a9fb5;
		text-transform: uppercase;
		margin-bottom: 0.5rem;
		letter-spacing: 0.5px;
	}

	.nodes-grid {
		display: grid;
		gap: 0.5rem;
	}

	.node-card {
		padding: 0.5rem;
		background: #1e1e1e;
		border: 1px solid #3c3c3c;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.node-card:hover {
		border-color: #007acc;
		background: #2d2d30;
	}

	.node-name {
		font-size: 0.8rem;
		font-weight: 600;
		color: #cccccc;
		margin-bottom: 0.25rem;
	}

	.node-desc {
		font-size: 0.7rem;
		color: #858585;
		margin-bottom: 0.25rem;
		line-height: 1.3;
	}

	.node-ports-info {
		display: flex;
		gap: 0.5rem;
		font-size: 0.65rem;
		color: #858585;
	}

	.port-count {
		background: #3c3c3c;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
	}
</style>
