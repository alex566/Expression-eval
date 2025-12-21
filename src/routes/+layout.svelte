<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<style global>
	:root {
		margin: 0;
		padding: 0;
	}

	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(body) {
		width: 100%;
		height: 100vh;
		overflow: hidden;
	}
</style>

{@render children()}
