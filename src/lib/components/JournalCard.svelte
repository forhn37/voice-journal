<script lang="ts">
	import type { Journal } from '$lib/utils/supabase';

	interface Props {
		journal: Journal;
		onclick?: () => void;
	}

	let { journal, onclick }: Props = $props();

	// 감정 이모지 매핑
	const emotionEmoji: Record<string, string> = {
		joy: '😊',
		sadness: '😢',
		anger: '😤',
		fear: '😨',
		anxiety: '😰',
		neutral: '😌'
	};

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
	class="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
	{onclick}
>
	<div class="flex gap-4">
		<!-- 이미지 -->
		<div class="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
			<img src={journal.image_url} alt="일기 이미지" class="w-full h-full object-cover" />
		</div>

		<!-- 내용 -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<span class="text-sm text-(--color-text-light)">{formatDate(journal.created_at)}</span>
				<span class="text-lg">{emotionEmoji[journal.emotion] || '📝'}</span>
			</div>
			<p class="text-base font-medium mb-1 line-clamp-1">{journal.summary}</p>
			<p class="text-sm text-(--color-text-light) line-clamp-2">{journal.transcript}</p>
		</div>
	</div>
</button>

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
