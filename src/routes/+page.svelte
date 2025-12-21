<script lang="ts">
	import { SvelteFlow, Controls, Background, type Node, type Edge } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	const nodes: Node[] = [
		{
			id: '1',
			data: { label: 'Node 1' },
			position: { x: 0, y: 0 }
		},
		{
			id: '2',
			data: { label: 'Node 2' },
			position: { x: 250, y: 0 }
		}
	];

	const edges: Edge[] = [
		{
			id: 'e1-2',
			source: '1',
			target: '2'
		}
	];
</script>

<div class="container">
	<SvelteFlow {nodes} {edges}>
		<Background />
		<Controls />
	</SvelteFlow>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
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
	}
</style>
