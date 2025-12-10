<script lang="ts">
	type EmptyStateType = 'calendar' | 'journal' | 'general';

	interface Props {
		type?: EmptyStateType;
		title?: string;
		description?: string;
		actionLabel?: string;
		onAction?: () => void;
	}

	let {
		type = 'general' as EmptyStateType,
		title,
		description,
		actionLabel,
		onAction
	}: Props = $props();

	// 타입별 기본 메시지
	const defaults: Record<EmptyStateType, { emoji: string; title: string; description: string }> = {
		calendar: {
			emoji: '📅',
			title: '아직 일기가 없어요',
			description: '첫 번째 그림일기를 만들어볼까요?'
		},
		journal: {
			emoji: '📔',
			title: '일기를 찾을 수 없어요',
			description: '다른 일기를 확인해보세요'
		},
		general: {
			emoji: '🐶',
			title: '아직 아무것도 없어요',
			description: '새로운 이야기를 들려주세요'
		}
	};

	// type이 변경될 때 반응하도록 함수 사용
	function getConfig(t: EmptyStateType) {
		return defaults[t];
	}
</script>

<div class="flex flex-col items-center justify-center py-12 px-6 animate-fade-up">
	<!-- 캐릭터 영역 -->
	<div class="relative mb-6">
		<!-- 배경 원 -->
		<div class="absolute inset-0 bg-(--color-secondary) rounded-full scale-150 opacity-50"></div>
		<!-- 이모지 -->
		<div class="relative text-6xl animate-float">
			{getConfig(type).emoji}
		</div>
	</div>

	<!-- 텍스트 -->
	<h3 class="text-lg font-semibold text-(--color-text) mb-2 text-center">
		{title || getConfig(type).title}
	</h3>
	<p class="text-sm text-(--color-text-light) text-center max-w-60 leading-relaxed">
		{description || getConfig(type).description}
	</p>

	<!-- 액션 버튼 (옵션) -->
	{#if actionLabel && onAction}
		<button
			onclick={onAction}
			class="mt-6 px-6 py-3 btn-primary"
		>
			{actionLabel}
		</button>
	{/if}

	<!-- 데코레이션 -->
	<div class="flex gap-2 mt-8 opacity-30">
		<div class="w-2 h-2 rounded-full bg-(--color-primary)"></div>
		<div class="w-2 h-2 rounded-full bg-(--color-primary-light)"></div>
		<div class="w-2 h-2 rounded-full bg-(--color-secondary)"></div>
	</div>
</div>
