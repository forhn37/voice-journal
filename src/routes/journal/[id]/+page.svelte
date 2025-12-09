<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { Journal } from '$lib/utils/supabase';

	let journal = $state<Journal | null>(null);
	let isLoading = $state(true);
	let errorMessage = $state('');

	// 감정 이모지 매핑
	const emotionEmoji: Record<string, string> = {
		joy: '😊',
		sadness: '😢',
		anger: '😤',
		fear: '😨',
		anxiety: '😰',
		neutral: '😌'
	};

	// 감정 한글 매핑
	const emotionKorean: Record<string, string> = {
		joy: '기쁨',
		sadness: '슬픔',
		anger: '화남',
		fear: '두려움',
		anxiety: '불안',
		neutral: '평온'
	};

	// 날짜 포맷팅
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
		const hours = date.getHours();
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${year}년 ${month}월 ${day}일 (${weekday}) ${hours}:${minutes}`;
	};

	onMount(async () => {
		const journalId = $page.params.id;

		try {
			const res = await fetch(`/api/journal?id=${journalId}`);
			const data = await res.json();

			if (data.success && data.journal) {
				journal = data.journal;
			} else {
				errorMessage = '일기를 찾을 수 없어요';
			}
		} catch (err) {
			errorMessage = '일기를 불러올 수 없어요';
		} finally {
			isLoading = false;
		}
	});

	function handleBack() {
		goto('/calendar');
	}
</script>

<svelte:head>
	<title>{journal ? '일기 상세' : '로딩 중...'} - Voice Journal</title>
</svelte:head>

<main class="flex-1 flex flex-col">
	<!-- 헤더 -->
	<header class="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
		<button
			onclick={handleBack}
			class="p-2 hover:bg-gray-100 rounded-full transition-colors"
			aria-label="뒤로 가기"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 19l-7-7 7-7"
				/>
			</svg>
		</button>
		<h1 class="text-lg font-semibold">일기</h1>
	</header>

	<!-- 본문 -->
	<div class="flex-1 overflow-auto px-6 py-6">
		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<div
					class="w-8 h-8 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin"
				></div>
			</div>
		{:else if errorMessage}
			<div class="text-center py-12">
				<p class="text-6xl mb-4">😢</p>
				<p class="text-lg text-(--color-text-light)">{errorMessage}</p>
			</div>
		{:else if journal}
			<!-- 이미지 -->
			<div class="rounded-2xl overflow-hidden shadow-lg mb-6">
				<img src={journal.image_url} alt="일기 그림" class="w-full aspect-square object-cover" />
			</div>

			<!-- 날짜 -->
			<p class="text-sm text-(--color-text-light) mb-4">{formatDate(journal.created_at)}</p>

			<!-- 요약 -->
			<p class="text-lg mb-4">{journal.summary}</p>

			<!-- 감정 -->
			<div class="flex items-center gap-2 mb-6">
				<span class="text-2xl">{emotionEmoji[journal.emotion] || '😌'}</span>
				<span class="text-(--color-text-light)"
					>{emotionKorean[journal.emotion] || '평온'}</span
				>
			</div>

			<!-- 전문 (transcript) -->
			<div class="bg-white/50 rounded-2xl p-4 mb-6">
				<p class="text-sm font-medium text-(--color-text-light) mb-2">내가 말한 내용</p>
				<p class="text-base leading-relaxed">{journal.transcript}</p>
			</div>

			<!-- 캐릭터 메시지 -->
			{#if journal.character_message}
				<div class="bg-orange-50 rounded-2xl p-4 mb-6">
					<p class="text-center">🐶 "{journal.character_message}"</p>
				</div>
			{/if}
		{/if}
	</div>
</main>
