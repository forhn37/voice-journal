<script lang="ts">
	import {
		startRecording,
		stopRecording,
		cancelRecording,
		validateDuration
	} from '$lib/utils/audio';

	type Status = 'idle' | 'recording' | 'processing';

	interface Props {
		onRecordingComplete: (blob: Blob, duration: number) => void;
		onError: (message: string) => void;
	}

	let { onRecordingComplete, onError }: Props = $props();

	let status = $state<Status>('idle');
	let duration = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;

	// 타이머 포맷팅
	let formattedTime = $derived(
		`${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
	);

	// 녹음 시작
	async function handleStart() {
		try {
			await startRecording();
			status = 'recording';
			duration = 0;

			// 타이머 시작
			timer = setInterval(() => {
				duration += 1;
				// 5분 초과 시 자동 정지
				if (duration >= 300) {
					handleStop();
				}
			}, 1000);
		} catch (err) {
			if (err instanceof Error && err.name === 'NotAllowedError') {
				onError('마이크 권한이 필요해요! 설정에서 허용해주세요.');
			} else {
				onError('마이크를 사용할 수 없어요.');
			}
		}
	}

	// 녹음 정지
	async function handleStop() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}

		const validation = validateDuration(duration);
		if (!validation.valid) {
			cancelRecording();
			status = 'idle';
			duration = 0;
			onError(validation.message || '녹음 시간이 올바르지 않아요');
			return;
		}

		status = 'processing';

		try {
			const result = await stopRecording();
			onRecordingComplete(result.blob, duration);
		} catch (err) {
			onError('녹음 처리 중 오류가 발생했어요');
		} finally {
			status = 'idle';
			duration = 0;
		}
	}

	// 버튼 클릭 핸들러
	function handleClick() {
		if (status === 'idle') {
			handleStart();
		} else if (status === 'recording') {
			handleStop();
		}
	}
</script>

<div class="flex flex-col items-center">
	<!-- 녹음 중 타이머 -->
	{#if status === 'recording'}
		<div class="mb-5 flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full animate-fade-in">
			<span class="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
			<span class="text-lg font-semibold text-red-600 tabular-nums">{formattedTime}</span>
		</div>
	{/if}

	<!-- 녹음 버튼 -->
	<div class="relative">
		<!-- 배경 링 애니메이션 (녹음 중) -->
		{#if status === 'recording'}
			<div class="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20"></div>
			<div class="absolute -inset-2 rounded-full border-4 border-red-200 animate-pulse"></div>
		{/if}

		<!-- idle 상태 배경 효과 -->
		{#if status === 'idle'}
			<div class="absolute -inset-3 rounded-full bg-(--color-primary-light) opacity-40 animate-pulse-soft"></div>
		{/if}

		<button
			class="relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
				   {status === 'recording'
				? 'bg-red-500 hover:bg-red-600 scale-110'
				: status === 'processing'
				? 'bg-(--color-primary) opacity-80'
				: 'bg-(--color-primary) hover:bg-(--color-primary-dark) hover:scale-105 active:scale-95'}"
			style={status === 'idle' ? 'box-shadow: 0 8px 32px rgba(255, 159, 122, 0.4);' : status === 'recording' ? 'box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4);' : ''}
			onclick={handleClick}
			disabled={status === 'processing'}
		>
			{#if status === 'idle'}
				<!-- 마이크 아이콘 -->
				<svg class="w-10 h-10 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
					/>
					<path
						d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
					/>
				</svg>
			{:else if status === 'recording'}
				<!-- 정지 아이콘 -->
				<svg class="w-8 h-8 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
					<rect x="6" y="6" width="12" height="12" rx="2" />
				</svg>
			{:else}
				<!-- 로딩 스피너 -->
				<svg class="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{/if}
		</button>
	</div>

	<!-- 안내 문구 -->
	<p class="mt-6 text-(--color-text-light) font-medium transition-all duration-300">
		{#if status === 'idle'}
			<span class="animate-fade-in">눌러서 말해봐!</span>
		{:else if status === 'recording'}
			<span class="text-red-500 animate-fade-in">탭해서 완료!</span>
		{:else}
			<span class="animate-fade-in">처리 중...</span>
		{/if}
	</p>
</div>
