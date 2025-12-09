<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { EMOTION_EMOJI } from '$lib/constants';
	import type { JournalSummary } from '$lib/types';

	let journals = $state<JournalSummary[]>([]);
	let currentDate = $state(new Date());
	let selectedJournal = $state<JournalSummary | null>(null);
	let isLoading = $state(true);

	onMount(async () => {
		await loadJournals();
	});

	async function loadJournals() {
		isLoading = true;
		try {
			const res = await fetch('/api/journal');
			const data = await res.json();
			if (data.success) {
				journals = data.journals;
			}
		} catch (err) {
			console.error('일기 로드 실패:', err);
		} finally {
			isLoading = false;
		}
	}

	// 현재 월의 날짜들 계산
	function getCalendarDays() {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();

		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);

		const days: (number | null)[] = [];

		// 첫 주 빈 칸
		for (let i = 0; i < firstDay.getDay(); i++) {
			days.push(null);
		}

		// 날짜들
		for (let i = 1; i <= lastDay.getDate(); i++) {
			days.push(i);
		}

		return days;
	}

	// 해당 날짜의 일기 찾기
	function getJournalForDay(day: number): JournalSummary | undefined {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();

		return journals.find((j) => {
			const jDate = new Date(j.created_at);
			return (
				jDate.getFullYear() === year &&
				jDate.getMonth() === month &&
				jDate.getDate() === day
			);
		});
	}

	// 이전/다음 달
	function prevMonth() {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
	}

	function nextMonth() {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
	}

	// 날짜 클릭
	function handleDayClick(day: number | null) {
		if (!day) return;
		const journal = getJournalForDay(day);
		if (journal) {
			selectedJournal = journal;
		}
	}

	// 월 포맷
	const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
	const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

	let calendarDays = $derived(getCalendarDays());
	let displayMonth = $derived(`${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`);
</script>

<main class="flex-1 flex flex-col px-4 py-6">
	<!-- 헤더 -->
	<div class="flex items-center justify-between mb-6">
		<button onclick={prevMonth} class="p-2 hover:bg-gray-100 rounded-full" aria-label="이전 달">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<h1 class="text-xl font-semibold">{displayMonth}</h1>
		<button onclick={nextMonth} class="p-2 hover:bg-gray-100 rounded-full" aria-label="다음 달">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	</div>

	<!-- 요일 헤더 -->
	<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;" class="mb-2">
		{#each dayNames as day, i}
			<div class="text-center text-sm py-2 {i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-(--color-text-light)'}">{day}</div>
		{/each}
	</div>

	<!-- 캘린더 그리드 -->
	{#if isLoading}
		<div class="flex-1 flex items-center justify-center">
			<div class="w-8 h-8 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else}
		<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
			{#each calendarDays as day, i}
				{@const journal = day ? getJournalForDay(day) : undefined}
				{@const dayOfWeek = i % 7}
				<button
					onclick={() => handleDayClick(day)}
					class="aspect-square flex flex-col items-center justify-center rounded-xl text-sm
						{day ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'}
						{journal ? 'bg-orange-100' : ''}"
					disabled={!day}
				>
					{#if day}
						<span class="{journal ? 'font-semibold' : ''} {dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : ''}">{day}</span>
						{#if journal}
							<span class="text-base mt-0.5">{EMOTION_EMOJI[journal.emotion] || '📝'}</span>
						{/if}
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	<!-- 선택된 일기 미리보기 (모달) -->
	{#if selectedJournal}
		<!-- 배경 오버레이 -->
		<div
			class="fixed inset-0 bg-black/50 z-40"
			onclick={() => (selectedJournal = null)}
			onkeydown={(e) => e.key === 'Escape' && (selectedJournal = null)}
			role="button"
			tabindex="0"
			aria-label="모달 닫기"
		></div>
		<!-- 모달 컨텐츠 -->
		<div
			class="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-auto z-50"
			role="dialog"
			aria-modal="true"
			aria-label="일기 미리보기"
		>
			<div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
			<img
				src={selectedJournal.image_url}
				alt="일기 이미지"
				class="w-full aspect-square object-cover rounded-2xl mb-4"
			/>
			<p class="text-lg mb-2">{selectedJournal.summary}</p>
			<p class="text-sm text-(--color-text-light)">
				{new Date(selectedJournal.created_at).toLocaleDateString('ko-KR', {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					weekday: 'long'
				})}
			</p>
			<div class="flex gap-3 mt-4">
				<button
					class="flex-1 py-3 bg-(--color-primary) text-white rounded-xl font-medium"
					onclick={() => goto(`/journal/${selectedJournal?.id}`)}
				>
					자세히 보기
				</button>
				<button
					class="flex-1 py-3 bg-gray-100 text-(--color-text) rounded-xl font-medium"
					onclick={() => (selectedJournal = null)}
				>
					닫기
				</button>
			</div>
		</div>
	{/if}
</main>

<BottomNav />
