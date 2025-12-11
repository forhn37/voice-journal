<script lang="ts">
	import './layout.css';
	import { invalidate } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	// Auth 상태 변화 감지
	onMount(() => {
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((_event: string, session: { expires_at?: number } | null) => {
			// 서버 세션과 클라이언트 세션이 다르면 데이터 갱신
			if (session?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin="anonymous" />
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
</svelte:head>

<div class="h-screen flex flex-col safe-area-top safe-area-bottom overflow-hidden">
	<!-- 페이지 전환 로딩 바 -->
	{#if $navigating}
		<div class="fixed top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 via-pink-500 to-purple-500 animate-pulse z-50" style="animation: loading 1.5s ease-in-out infinite;"></div>
	{/if}

	{@render children()}
</div>

<style>
	@keyframes loading {
		0% { transform: translateX(-100%); }
		50% { transform: translateX(0); }
		100% { transform: translateX(100%); }
	}
</style>
