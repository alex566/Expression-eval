<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';

	type $$Props = NodeProps;

	export let data: $$Props['data'];

	// Extract input and output ports from data
	const inputs: string[] = (data.inputs as string[]) || [];
	const outputs: string[] = (data.outputs as string[]) || [];
</script>

<div class="custom-node">
	<!-- Input handles on the left -->
	{#if inputs.length > 0}
		<div class="handles-container left">
			{#each inputs as input, i}
				<div class="handle-wrapper">
					<Handle
						type="target"
						position={Position.Left}
						id={input}
						style="top: {(i + 1) * (100 / (inputs.length + 1))}%"
					/>
					<span class="handle-label left">{input}</span>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Node content -->
	<div class="node-content">
		<div class="node-label">{data.label}</div>
	</div>

	<!-- Output handles on the right -->
	{#if outputs.length > 0}
		<div class="handles-container right">
			{#each outputs as output, i}
				<div class="handle-wrapper">
					<Handle
						type="source"
						position={Position.Right}
						id={output}
						style="top: {(i + 1) * (100 / (outputs.length + 1))}%"
					/>
					<span class="handle-label right">{output}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.custom-node {
		position: relative;
		background: white;
		border: 2px solid #1a192b;
		border-radius: 8px;
		padding: 12px 16px;
		min-width: 150px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.custom-node:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
	}

	.node-content {
		text-align: center;
		user-select: none;
	}

	.node-label {
		font-weight: 600;
		font-size: 14px;
		color: #1a192b;
	}

	.handles-container {
		position: absolute;
		top: 0;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		pointer-events: none;
	}

	.handles-container.left {
		left: 0;
	}

	.handles-container.right {
		right: 0;
	}

	.handle-wrapper {
		position: relative;
		pointer-events: all;
	}

	.handle-label {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		font-size: 11px;
		color: #64748b;
		white-space: nowrap;
		background: white;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid #e2e8f0;
	}

	.handle-label.left {
		right: 12px;
	}

	.handle-label.right {
		left: 12px;
	}

	:global(.svelte-flow__handle) {
		width: 10px;
		height: 10px;
		background: #3b82f6;
		border: 2px solid white;
		pointer-events: all;
	}

	:global(.svelte-flow__handle:hover) {
		background: #2563eb;
		transform: scale(1.2);
	}

	:global(.svelte-flow__handle.connecting) {
		background: #10b981;
	}

	:global(.svelte-flow__handle.valid) {
		background: #10b981;
	}
</style>
