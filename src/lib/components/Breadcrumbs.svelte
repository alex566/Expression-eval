<script lang="ts">
	interface Breadcrumb {
		label: string;
		nodeId?: string;
	}

	export let breadcrumbs: Breadcrumb[] = [];
	export let onNavigate: (index: number) => void = () => {};
</script>

<div class="breadcrumbs">
	{#each breadcrumbs as crumb, index}
		{#if index > 0}
			<span class="separator">/</span>
		{/if}
		<button
			class="breadcrumb"
			class:active={index === breadcrumbs.length - 1}
			onclick={() => onNavigate(index)}
		>
			{crumb.label}
		</button>
	{/each}
</div>

<style>
	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #f3f4f6;
		border-bottom: 1px solid #e5e7eb;
		font-size: 0.875rem;
		overflow-x: auto;
	}

	.breadcrumb {
		background: none;
		border: none;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		color: #3b82f6;
		font-weight: 500;
		border-radius: 0.25rem;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.breadcrumb:hover {
		background: #dbeafe;
		color: #2563eb;
	}

	.breadcrumb.active {
		color: #1f2937;
		font-weight: 600;
		cursor: default;
	}

	.breadcrumb.active:hover {
		background: none;
	}

	.separator {
		color: #9ca3af;
		user-select: none;
	}
</style>
