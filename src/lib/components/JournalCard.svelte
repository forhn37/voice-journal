<script lang="ts">
	import type { Journal } from '$lib/utils/supabase';
	import { EMOTION_EMOJI } from '$lib/constants';

	interface Props {
		journal: Journal;
		onclick?: () => void;
	}

	let { journal, onclick }: Props = $props();

	// 날짜 포맷팅
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
		return `${month}월 ${day}일 (${weekday})`;
	};
</script>

<button
	class="w-full card card-hover p-4 text-left group"
	{onclick}
>
	<div class="flex gap-4">
		<!-- 이미지 -->
		<div class="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-sm">
			<img
				src={journal.image_url}
				alt="일기 이미지"
				class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
			/>
			<!-- 감정 뱃지 -->
			<div class="absolute bottom-1 right-1 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
				<span class="text-sm">{EMOTION_EMOJI[journal.emotion] || '📝'}</span>
			</div>
		</div>

		<!-- 내용 -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1.5">
				<span class="text-sm text-(--color-text-light)">{formatDate(journal.created_at)}</span>
			</div>
			<p class="text-base font-semibold text-(--color-text) mb-1 line-clamp-1">{journal.summary}</p>
			<p class="text-sm text-(--color-text-light) line-clamp-2 leading-relaxed">{journal.transcript}</p>
		</div>
	</div>
</button>

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
