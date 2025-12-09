<script lang="ts">
	import { onMount } from 'svelte';

	type Journal = {
		id: string;
		summary: string;
		emotion: string;
		image_url: string;
		created_at: string;
	};

	let journals = $state<Journal[]>([]);
	let currentDate = $state(new Date());
	let selectedJournal = $state<Journal | null>(null);
	let isLoading = $state(true);

	// 감정 이모지 매핑
	const emotionEmoji: Record<string, string> = {
		joy: '😊',
		sadness: '😢',
		anger: '😤',
		fear: '😨',
		anxiety: '😰',
		neutral: '😌'
	};

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
	function getJournalForDay(day: number): Journal | undefined {
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
		<button onclick={prevMonth} class="p-2 hover:bg-gray-100 rounded-full">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<h1 class="text-xl font-semibold">{displayMonth}</h1>
		<button onclick={nextMonth} class="p-2 hover:bg-gray-100 rounded-full">
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
							<span class="text-base mt-0.5">{emotionEmoji[journal.emotion] || '📝'}</span>
						{/if}
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	<!-- 선택된 일기 미리보기 -->
	{#if selectedJournal}
		<div class="fixed inset-0 bg-black/50 flex items-end z-50" onclick={() => selectedJournal = null}>
			<div
				class="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-auto"
				onclick={(e) => e.stopPropagation()}
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
				<button
					class="w-full mt-4 py-3 bg-(--color-primary) text-white rounded-xl font-medium"
					onclick={() => selectedJournal = null}
				>
					닫기
				</button>
			</div>
		</div>
	{/if}
</main>

<!-- 하단 네비게이션 -->
<nav class="flex justify-around py-4 border-t border-gray-200">
	<a href="/" class="flex flex-col items-center text-(--color-text-light) hover:text-(--color-primary)">
		<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
			/>
		</svg>
		<span class="text-xs mt-1">기록</span>
	</a>
	<a href="/calendar" class="flex flex-col items-center text-(--color-primary)">
		<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
			<path
				d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
			/>
		</svg>
		<span class="text-xs mt-1">캘린더</span>
	</a>
</nav>
