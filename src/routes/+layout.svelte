<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin="anonymous" />
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
</svelte:head>

<div class="min-h-screen flex flex-col safe-area-top safe-area-bottom">
	{@render children()}
</div>
