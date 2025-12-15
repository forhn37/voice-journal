<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { EMOTION_EMOJI, EMOTION_KOREAN } from '$lib/constants';
	import type { EmotionStats, Emotion } from '$lib/types';
	import EmotionChart from '$lib/components/EmotionChart.svelte';
	import EmotionTrend from '$lib/components/EmotionTrend.svelte';

	let { data: pageData } = $props();

	let stats = $state<EmotionStats | null>(null);
	let isLoading = $state(true);
	let errorMessage = $state('');
	let period = $state<'week' | 'month'>('week');

	async function loadStats() {
		isLoading = true;
		errorMessage = '';

		try {
			const res = await fetch(`/api/stats?period=${period}`);
			const data = await res.json();

			if (data.success) {
				stats = data.stats;
			} else {
				errorMessage = data.message || '통계를 불러올 수 없어요';
			}
		} catch (err) {
			errorMessage = '통계를 불러오는 중 오류가 발생했어요';
		} finally {
			isLoading = false;
		}
	}

	onMount(async () => {
		// 로그인 체크
		if (!pageData.user) {
			goto('/login');
			return;
		}

		loadStats();
	});

	function handlePeriodChange(newPeriod: 'week' | 'month') {
		period = newPeriod;
		loadStats();
	}

	// 가장 많은 감정 찾기
	let topEmotion = $derived.by(() => {
		if (!stats) return null;

		let maxEmotion: Emotion = 'neutral';
		let maxCount = 0;

		for (const [emotion, count] of Object.entries(stats.emotionDistribution)) {
			if (count > maxCount) {
				maxEmotion = emotion as Emotion;
				maxCount = count;
			}
		}

		return maxCount > 0 ? maxEmotion : null;
	});
</script>

<svelte:head>
	<title>감정 통계 - Voice Journal</title>
</svelte:head>

<main class="flex-1 flex flex-col">
	<!-- 헤더 -->
	<header class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
		<h1 class="text-lg font-semibold">감정 통계</h1>
		<div class="flex gap-2">
			<button
				onclick={() => handlePeriodChange('week')}
				class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
					{period === 'week'
					? 'bg-(--color-primary) text-white'
					: 'bg-gray-100 text-(--color-text-muted) hover:bg-gray-200'}"
			>
				주간
			</button>
			<button
				onclick={() => handlePeriodChange('month')}
				class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
					{period === 'month'
					? 'bg-(--color-primary) text-white'
					: 'bg-gray-100 text-(--color-text-muted) hover:bg-gray-200'}"
			>
				월간
			</button>
		</div>
	</header>

	<!-- 본문 -->
	<div class="flex-1 overflow-auto px-6 py-6">
		{#if isLoading}
			<!-- 스켈레톤 로딩 -->
			<div class="animate-fade-in space-y-6">
				<div class="card p-6">
					<div class="h-6 w-32 skeleton mb-4"></div>
					<div class="flex gap-4">
						<div class="flex-1">
							<div class="h-4 w-20 skeleton mb-2"></div>
							<div class="h-8 w-16 skeleton"></div>
						</div>
						<div class="flex-1">
							<div class="h-4 w-20 skeleton mb-2"></div>
							<div class="h-8 w-16 skeleton"></div>
						</div>
					</div>
				</div>
				<div class="card p-6">
					<div class="h-6 w-32 skeleton mb-4"></div>
					<div class="h-64 skeleton"></div>
				</div>
			</div>
		{:else if errorMessage}
			<div class="flex flex-col items-center justify-center py-12 animate-fade-up">
				<div class="relative mb-6">
					<div class="absolute inset-0 bg-red-100 rounded-full scale-150 opacity-50"></div>
					<div class="relative text-6xl">🐻</div>
				</div>
				<p class="text-lg font-semibold text-(--color-text) mb-2">{errorMessage}</p>
				<button onclick={loadStats} class="mt-4 px-6 py-3 btn-primary">
					다시 시도
				</button>
			</div>
		{:else if stats}
			<div class="space-y-6 animate-fade-up">
				<!-- 요약 카드 -->
				<div class="card p-6">
					<h2 class="text-base font-semibold mb-4">요약</h2>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-sm text-(--color-text-light) mb-1">총 일기</p>
							<p class="text-2xl font-bold text-(--color-primary)">{stats.totalJournals}개</p>
						</div>
						<div>
							<p class="text-sm text-(--color-text-light) mb-1">스트릭</p>
							<p class="text-2xl font-bold text-(--color-primary)">🔥 {stats.streak}일</p>
						</div>
					</div>
					{#if topEmotion}
						<div class="mt-4 pt-4 border-t border-gray-100">
							<p class="text-sm text-(--color-text-light) mb-2">가장 많은 감정</p>
							<div class="flex items-center gap-2">
								<span class="text-3xl">{EMOTION_EMOJI[topEmotion]}</span>
								<span class="text-lg font-semibold">{EMOTION_KOREAN[topEmotion]}</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- 감정 분포 차트 -->
				{#if stats.totalJournals > 0}
					<div class="card p-6">
						<h2 class="text-base font-semibold mb-4">감정 분포</h2>
						<EmotionChart emotionDistribution={stats.emotionDistribution} />
					</div>

					<!-- 감정 트렌드 -->
					{#if stats.dailyEmotions.length > 0}
						<div class="card p-6">
							<h2 class="text-base font-semibold mb-4">감정 트렌드</h2>
							<EmotionTrend dailyEmotions={stats.dailyEmotions} />
						</div>
					{/if}
				{:else}
					<div class="card p-12 text-center">
						<div class="text-6xl mb-4">📊</div>
						<p class="text-lg font-semibold text-(--color-text) mb-2">
							아직 일기가 없어요
						</p>
						<p class="text-sm text-(--color-text-light) mb-6">
							일기를 작성하면 감정 통계를 확인할 수 있어요
						</p>
						<a href="/" class="btn-primary inline-block px-6 py-3">
							일기 작성하기
						</a>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</main>

<BottomNav />
