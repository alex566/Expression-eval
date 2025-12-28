<script lang="ts">
	let { selectedGraph, onGraphChange }: { 
		selectedGraph: string; 
		onGraphChange: (graphKey: string) => void 
	} = $props();

	let isExpanded = $state(true);

	const graphs = [
		{ key: 'sample', name: 'Sample Graph', description: 'Basic addition example' },
		{ key: 'complex', name: 'Complex Graph', description: 'Multiple operations and nodes' },
		{ key: 'dates', name: 'Date Operations', description: 'Working with dates and times' },
		{ key: 'arrays', name: 'Array Operations', description: 'Array manipulation and transformations' },
		{ key: 'mapfilterreduce', name: 'Map/Filter/Reduce', description: 'Functional array operations' },
		{ key: 'functions', name: 'Function-Based', description: 'Custom function definitions' }
	];

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

	function selectGraph(key: string) {
		onGraphChange(key);
	}
</script>

<div class="sample-graphs-panel">
	<button class="panel-header" onclick={toggleExpanded}>
		<span class="header-title">
			<span class="icon">{isExpanded ? '▼' : '▶'}</span>
			Sample Graphs
		</span>
	</button>
	
	{#if isExpanded}
		<div class="panel-content">
			{#each graphs as graph}
				<button 
					class="graph-item" 
					class:active={selectedGraph === graph.key}
					onclick={() => selectGraph(graph.key)}
				>
					<div class="graph-name">{graph.name}</div>
					<div class="graph-desc">{graph.description}</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.sample-graphs-panel {
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
	}

	.panel-header:hover {
		background: #3e3e42;
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
		padding: 0.5rem;
		background: #252526;
	}

	.graph-item {
		width: 100%;
		padding: 0.75rem;
		background: #1e1e1e;
		border: 1px solid #3c3c3c;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		cursor: pointer;
		text-align: left;
		transition: all 0.2s;
		color: #cccccc;
	}

	.graph-item:last-child {
		margin-bottom: 0;
	}

	.graph-item:hover {
		border-color: #007acc;
		background: #2d2d30;
	}

	.graph-item.active {
		background: #007acc;
		border-color: #007acc;
		color: white;
	}

	.graph-item.active .graph-desc {
		color: rgba(255, 255, 255, 0.8);
	}

	.graph-name {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.graph-desc {
		font-size: 0.75rem;
		color: #858585;
		line-height: 1.3;
	}
</style>
