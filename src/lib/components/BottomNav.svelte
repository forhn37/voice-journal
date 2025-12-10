<script lang="ts">
	import { page } from '$app/state';

	let currentPath = $derived(page.url.pathname);
</script>

<nav class="flex justify-around py-3 bg-(--color-surface) border-t border-gray-100 safe-area-bottom">
	<a
		href="/"
		class="relative flex flex-col items-center px-6 py-2 rounded-xl transition-all duration-200
			{currentPath === '/'
			? 'text-(--color-primary)'
			: 'text-(--color-text-muted) hover:text-(--color-primary) hover:bg-(--color-surface-hover)'}"
	>
		<!-- 활성 인디케이터 -->
		{#if currentPath === '/'}
			<div class="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-(--color-primary) rounded-full"></div>
		{/if}
		{#if currentPath === '/'}
			<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
				<path
					d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
				/>
			</svg>
		{:else}
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
				/>
			</svg>
		{/if}
		<span class="text-xs mt-1 font-medium">기록</span>
	</a>
	<a
		href="/calendar"
		class="relative flex flex-col items-center px-6 py-2 rounded-xl transition-all duration-200
			{currentPath === '/calendar' || currentPath.startsWith('/journal/')
			? 'text-(--color-primary)'
			: 'text-(--color-text-muted) hover:text-(--color-primary) hover:bg-(--color-surface-hover)'}"
	>
		<!-- 활성 인디케이터 -->
		{#if currentPath === '/calendar' || currentPath.startsWith('/journal/')}
			<div class="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-(--color-primary) rounded-full"></div>
		{/if}
		{#if currentPath === '/calendar' || currentPath.startsWith('/journal/')}
			<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
				/>
			</svg>
		{:else}
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
				/>
			</svg>
		{/if}
		<span class="text-xs mt-1 font-medium">캘린더</span>
	</a>
</nav>
