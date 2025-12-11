<script lang="ts">
	interface Props {
		show: boolean;
		title?: string;
		message: string;
		confirmText?: string;
		icon?: string;
		onConfirm: () => void;
	}

	let {
		show = false,
		title = '',
		message,
		confirmText = '확인',
		icon = '📧',
		onConfirm
	}: Props = $props();

	// 줄바꿈을 <br>로 변환
	let formattedMessage = $derived(message.split('\n').join('<br>'));
</script>

{#if show}
	<!-- 모달 전체 컨테이너 (중앙 정렬용) -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="alert-title"
		aria-describedby="alert-message"
	>
		<!-- 배경 오버레이 -->
		<div
			class="absolute inset-0 bg-black/50 animate-fade-in"
			onclick={onConfirm}
			onkeydown={(e) => e.key === 'Escape' && onConfirm()}
			role="button"
			tabindex="0"
			aria-label="모달 닫기"
		></div>

		<!-- 모달 컨텐츠 -->
		<div
			class="relative w-full max-w-sm bg-(--color-surface) rounded-3xl p-5 animate-scale-up max-h-[80vh] overflow-y-auto"
			style="box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);"
		>
			<!-- 아이콘 -->
			<div class="flex justify-center mb-3">
				<div class="relative">
					<div class="absolute inset-0 bg-blue-100 rounded-full scale-150 opacity-50"></div>
					<div class="relative text-4xl animate-float">{icon}</div>
				</div>
			</div>

			<!-- 타이틀 (옵션) -->
			{#if title}
				<h3 id="alert-title" class="text-lg font-semibold text-(--color-text) text-center mb-2">
					{title}
				</h3>
			{/if}

			<!-- 메시지 -->
			<p id="alert-message" class="text-sm text-(--color-text-light) text-center mb-5 leading-relaxed">
				{@html formattedMessage}
			</p>

			<!-- 확인 버튼 -->
			<button
				class="w-full py-3 btn-primary text-sm"
				onclick={onConfirm}
			>
				{confirmText}
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes scale-up {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.animate-scale-up {
		animation: scale-up 0.2s ease-out forwards;
	}
</style>
