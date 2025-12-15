<script lang="ts">
	import { EMOTION_EMOJI } from '$lib/constants';
	import type { DailyEmotion, Emotion } from '$lib/types';

	let { dailyEmotions } = $props<{
		dailyEmotions: DailyEmotion[];
	}>();

	// 감정별 색상
	const EMOTION_COLORS: Record<Emotion, string> = {
		joy: '#FFD700',
		sadness: '#87CEEB',
		anger: '#FF6B6B',
		fear: '#9370DB',
		anxiety: '#DDA0DD',
		neutral: '#C0C0C0'
	};

	// 날짜 포맷팅 (MM/DD)
	function formatDate(dateStr: string) {
		const [, month, day] = dateStr.split('-');
		return `${month}/${day}`;
	}

	// 감정 색상 가져오기
	function getEmotionColor(emotion: string): string {
		return EMOTION_COLORS[emotion as Emotion] || EMOTION_COLORS.neutral;
	}

	// 감정 이모지 가져오기
	function getEmotionEmoji(emotion: string): string {
		return EMOTION_EMOJI[emotion as Emotion] || EMOTION_EMOJI.neutral;
	}
</script>

<div class="space-y-3">
	{#each dailyEmotions as { date, emotion, count }}
		<div class="flex items-center gap-3">
			<div class="w-16 text-sm text-(--color-text-light)">
				{formatDate(date)}
			</div>
			<div class="flex-1">
				<div class="h-8 bg-gray-100 rounded-full overflow-hidden relative">
					<div
						class="h-full rounded-full transition-all duration-500"
						style="width: {Math.min(count * 20, 100)}%; background-color: {getEmotionColor(emotion)}"
					></div>
				</div>
			</div>
			<div class="flex items-center gap-1.5 w-20">
				<span class="text-lg">{getEmotionEmoji(emotion)}</span>
				<span class="text-sm text-(--color-text-muted)">{count}회</span>
			</div>
		</div>
	{/each}
</div>
