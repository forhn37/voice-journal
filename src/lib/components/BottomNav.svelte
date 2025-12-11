<script lang="ts">
	import { page } from '$app/state';
	import { journalCreationStore } from '$lib/stores/journalCreation.svelte';

	let currentPath = $derived(page.url.pathname);

	// "기록" 탭 클릭 시 스토어 리셋
	function handleRecordTabClick() {
		journalCreationStore.reset();
	}
</script>

<nav class="flex justify-around py-3 bg-(--color-surface) border-t border-gray-100 safe-area-bottom">
	<a
		href="/"
		onclick={handleRecordTabClick}
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
		data-sveltekit-preload-data="hover"
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
	<a
		href="/settings"
		data-sveltekit-preload-data="hover"
		class="relative flex flex-col items-center px-6 py-2 rounded-xl transition-all duration-200
			{currentPath === '/settings'
			? 'text-(--color-primary)'
			: 'text-(--color-text-muted) hover:text-(--color-primary) hover:bg-(--color-surface-hover)'}"
	>
		<!-- 활성 인디케이터 -->
		{#if currentPath === '/settings'}
			<div class="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-(--color-primary) rounded-full"></div>
		{/if}
		{#if currentPath === '/settings'}
			<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
				<path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
			</svg>
		{:else}
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
				/>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
		{/if}
		<span class="text-xs mt-1 font-medium">설정</span>
	</a>
</nav>
