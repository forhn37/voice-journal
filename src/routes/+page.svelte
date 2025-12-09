<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import RecordButton from '$lib/components/RecordButton.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { EMOTION_EMOJI, EMOTION_KOREAN } from '$lib/constants';
	import type { AnalysisResult, UsageInfo, Emotion } from '$lib/types';

	// 페이지 상태
	type PageStatus = 'idle' | 'transcribing' | 'analyzing' | 'generating' | 'saving' | 'completed';

	let nickname = $state('');
	let errorMessage = $state('');
	let pageStatus = $state<PageStatus>('idle');

	// 결과 데이터
	let transcript = $state('');
	let audioDuration = $state(0);
	let analysisResult = $state<AnalysisResult | null>(null);
	let imageUrl = $state('');
	let savedJournalId = $state<string | null>(null);

	// 사용량 정보
	let usageInfo = $state<UsageInfo | null>(null);

	onMount(async () => {
		// 온보딩 체크
		const completed = localStorage.getItem('onboarding_completed');
		if (!completed) {
			goto('/onboarding');
			return;
		}
		nickname = localStorage.getItem('nickname') || '';

		// 사용량 로드
		await loadUsage();
	});

	// 사용량 로드
	async function loadUsage() {
		if (!browser) return; // 브라우저에서만 실행

		try {
			const res = await fetch('/api/usage');
			const data = await res.json();
			if (data.success) {
				usageInfo = {
					used: data.used,
					limit: data.limit,
					remaining: data.remaining,
					canCreate: data.canCreate
				};
			}
		} catch (err) {
			console.error('사용량 조회 실패:', err);
		}
	}

	// 일기 저장 함수
	async function saveJournal() {
		if (!analysisResult || !imageUrl) return;

		try {
			const res = await fetch('/api/journal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					transcript,
					summary: analysisResult.summary,
					emotion: analysisResult.emotion,
					emotionScore: analysisResult.emotionScore,
					scene: analysisResult.scene,
					characterMessage: analysisResult.characterMessage,
					imageUrl,
					audioDuration
				})
			});
			const data = await res.json();

			if (data.success) {
				savedJournalId = data.journal.id;
			}
		} catch (err) {
			console.error('일기 저장 실패:', err);
		}
	}

	// 녹음 완료 핸들러 - 전체 플로우 실행
	async function handleRecordingComplete(blob: Blob, duration: number) {
		audioDuration = duration;

		// 사용량 체크
		if (usageInfo && !usageInfo.canCreate) {
			handleError('오늘은 여기까지! 내일 다시 이야기 들려줘 🐶');
			return;
		}

		try {
			// Step 1: STT (Whisper)
			pageStatus = 'transcribing';

			const formData = new FormData();
			formData.append('audio', blob, 'recording.webm');

			const sttRes = await fetch('/api/transcribe', {
				method: 'POST',
				body: formData
			});
			const sttData = await sttRes.json();

			if (!sttData.success) {
				throw new Error(sttData.message || '음성 인식에 실패했어요');
			}

			transcript = sttData.transcript;

			// Step 2: GPT 분석
			pageStatus = 'analyzing';

			const analyzeRes = await fetch('/api/analyze', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ transcript })
			});
			const analyzeData = await analyzeRes.json();

			if (!analyzeData.success) {
				throw new Error(analyzeData.message || 'AI 분석에 실패했어요');
			}

			analysisResult = {
				scene: analyzeData.scene,
				emotion: analyzeData.emotion,
				emotionScore: analyzeData.emotionScore,
				summary: analyzeData.summary,
				characterMessage: analyzeData.characterMessage
			};

			// Step 3: DALL-E 이미지 생성
			pageStatus = 'generating';

			const imageRes = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					scene: analysisResult.scene,
					emotion: analysisResult.emotion
				})
			});
			const imageData = await imageRes.json();

			if (!imageData.success) {
				throw new Error(imageData.message || '그림 생성에 실패했어요');
			}

			imageUrl = imageData.imageUrl;

			// Step 4: DB에 저장
			pageStatus = 'saving';
			await saveJournal();

			// 사용량 다시 로드
			await loadUsage();

			// 완료
			pageStatus = 'completed';
		} catch (err) {
			handleError(err instanceof Error ? err.message : '오류가 발생했어요');
			pageStatus = 'idle';
		}
	}

	// 다시 시작
	async function resetState() {
		pageStatus = 'idle';
		transcript = '';
		audioDuration = 0;
		analysisResult = null;
		imageUrl = '';
		savedJournalId = null;

		// 사용량 다시 로드
		await loadUsage();
	}

	// 에러 핸들러
	function handleError(message: string) {
		errorMessage = message;
		setTimeout(() => {
			errorMessage = '';
		}, 3000);
	}

</script>

<main class="flex-1 flex flex-col items-center justify-center px-6 pb-8">
	<!-- 에러 토스트 -->
	{#if errorMessage}
		<div
			class="fixed top-4 left-4 right-4 bg-red-100 text-red-700 px-4 py-3 rounded-xl text-center z-50"
		>
			{errorMessage}
		</div>
	{/if}

	<!-- 상태별 화면 -->
	{#if pageStatus === 'idle'}
		<!-- 기본 화면: 녹음 대기 -->
		<div class="text-center mb-8">
			<p class="text-6xl mb-4">🐶</p>
			<h1 class="text-2xl font-semibold mb-2">
				{#if nickname}{nickname}아,{/if} 오늘 하루
			</h1>
			<p class="text-xl text-(--color-text-light)">어땠어?</p>
		</div>

		<!-- 사용량 표시 -->
		{#if usageInfo}
			<div class="mb-6 text-center">
				<div class="inline-flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full text-sm">
					<span class="text-(--color-text-light)">오늘</span>
					<div class="flex gap-1">
						{#each Array(usageInfo.limit) as _, i}
							<div class="w-2 h-2 rounded-full {i < usageInfo.used ? 'bg-(--color-primary)' : 'bg-gray-300'}"></div>
						{/each}
					</div>
					<span class="font-medium">{usageInfo.remaining}번 남음</span>
				</div>
			</div>
		{/if}

		{#if !usageInfo || usageInfo.canCreate}
			<!-- 사용량 정보가 없거나(로딩 중) 생성 가능하면 버튼 표시 -->
			<RecordButton onRecordingComplete={handleRecordingComplete} onError={handleError} />
		{:else}
			<!-- 제한 초과 메시지 -->
			<div class="text-center px-6">
				<div class="bg-orange-50 rounded-2xl p-6 mb-4">
					<p class="text-lg mb-2">오늘은 여기까지!</p>
					<p class="text-(--color-text-light)">내일 다시 이야기 들려줘 🐶</p>
				</div>
				<p class="text-sm text-(--color-text-light)">매일 자정에 초기화돼요</p>
			</div>
		{/if}
	{:else if pageStatus === 'completed' && analysisResult}
		<!-- 완료 화면: 결과 표시 -->
		<div class="w-full max-w-sm">
			<!-- 이미지 -->
			<div class="rounded-2xl overflow-hidden shadow-lg mb-6">
				<img src={imageUrl} alt="오늘의 그림일기" class="w-full aspect-square object-cover" />
			</div>

			<!-- 요약 -->
			<p class="text-lg mb-4">{analysisResult.summary}</p>

			<!-- 감정 -->
			<div class="flex items-center gap-2 mb-4">
				<span class="text-2xl">{EMOTION_EMOJI[analysisResult.emotion] || '😌'}</span>
				<span class="text-(--color-text-light)">{EMOTION_KOREAN[analysisResult.emotion] || '평온'}</span>
			</div>

			<!-- 캐릭터 메시지 -->
			<div class="bg-white/50 rounded-2xl p-4 mb-6">
				<p class="text-center">🐶 "{analysisResult.characterMessage}"</p>
			</div>

			<!-- 버튼들 -->
			<div class="flex gap-3">
				<button
					class="flex-1 py-3 bg-(--color-primary) text-white rounded-xl font-medium"
					onclick={resetState}
				>
					새 일기 쓰기
				</button>
			</div>
		</div>
	{:else}
		<!-- 로딩 화면 -->
		<div class="text-center">
			<p class="text-6xl mb-6 animate-bounce">🐶</p>
			<p class="text-xl font-medium mb-2">
				{#if pageStatus === 'transcribing'}
					오늘 이야기 듣고 있어...
				{:else if pageStatus === 'analyzing'}
					음... 그랬구나~
				{:else if pageStatus === 'generating'}
					그림 그리는 중! 잠깐만~
				{:else if pageStatus === 'saving'}
					일기장에 저장하는 중...
				{/if}
			</p>
			<div class="flex justify-center">
				<div class="w-8 h-8 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin"></div>
			</div>
		</div>
	{/if}
</main>

<BottomNav />
