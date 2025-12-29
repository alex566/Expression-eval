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
		/* Allow scrolling on mobile, prevent on desktop */
		overflow: auto;
		/* Ensure proper spacing for iOS status bar and safe areas */
		padding-top: env(safe-area-inset-top);
		padding-bottom: env(safe-area-inset-bottom);
		padding-left: env(safe-area-inset-left);
		padding-right: env(safe-area-inset-right);
		/* Prevent rubber-band effect on iOS */
		overscroll-behavior: none;
	}
	
	@media (min-width: 768px) {
		:global(body) {
			overflow: hidden;
		}
	}
</style>

{@render children()}
