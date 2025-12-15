<script lang="ts">
	import { goto } from '$app/navigation';
	import { EMOTION_EMOJI, EMOTION_KOREAN } from '$lib/constants';
	import type { Journal, Emotion } from '$lib/types';

	let { journal, oneYearAgoDate } = $props<{
		journal: Journal;
		oneYearAgoDate: string;
	}>();

	// 날짜 포맷팅
	function formatDate(dateStr: string) {
		const [year, month, day] = dateStr.split('-');
		return `${year}년 ${month}월 ${day}일`;
	}

	// 일기 상세 페이지로 이동
	function handleViewDetail() {
		goto(`/journal/${journal.id}`);
	}
</script>

<div class="card p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 animate-fade-up">
	<div class="flex items-center gap-2 mb-4">
		<span class="text-2xl">📅</span>
		<div>
			<h3 class="text-sm font-semibold text-purple-700">1년 전 오늘</h3>
			<p class="text-xs text-purple-600">{formatDate(oneYearAgoDate)}</p>
		</div>
	</div>

	<!-- 이미지 -->
	<div class="relative rounded-xl overflow-hidden mb-4 shadow-md">
		<img
			src={journal.image_url}
			alt="1년 전 일기 그림"
			class="w-full aspect-square object-cover"
		/>
		<!-- 감정 뱃지 -->
		<div class="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
			<span class="text-base">{EMOTION_EMOJI[journal.emotion as Emotion]}</span>
		</div>
	</div>

	<!-- 요약 -->
	<p class="text-sm text-(--color-text) leading-relaxed mb-4 italic">
		"{journal.summary}"
	</p>

	<!-- 감정 -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-1.5 px-2.5 py-1 bg-white/80 rounded-full">
			<span class="text-sm">{EMOTION_EMOJI[journal.emotion as Emotion]}</span>
			<span class="text-xs font-medium text-(--color-text-muted)">{EMOTION_KOREAN[journal.emotion as Emotion]}</span>
		</div>

		<button
			onclick={handleViewDetail}
			class="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline transition-all"
		>
			자세히 보기 →
		</button>
	</div>
</div>
