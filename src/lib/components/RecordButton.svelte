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
		<div class="mb-4 flex items-center gap-2">
			<span class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
			<span class="text-lg font-medium">{formattedTime}</span>
		</div>
	{/if}

	<!-- 녹음 버튼 -->
	<button
		class="w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95
			   {status === 'recording'
			? 'bg-red-500 hover:bg-red-600'
			: 'bg-(--color-primary) hover:bg-(--color-primary-dark)'}"
		onclick={handleClick}
		disabled={status === 'processing'}
	>
		{#if status === 'idle'}
			<!-- 마이크 아이콘 -->
			<svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
				/>
				<path
					d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
				/>
			</svg>
		{:else if status === 'recording'}
			<!-- 정지 아이콘 -->
			<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
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

	<!-- 안내 문구 -->
	<p class="mt-6 text-(--color-text-light)">
		{#if status === 'idle'}
			눌러서 말해봐!
		{:else if status === 'recording'}
			탭해서 완료!
		{:else}
			처리 중...
		{/if}
	</p>
</div>
