<script lang="ts">
	import { goto, beforeNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import RecordButton from '$lib/components/RecordButton.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { EMOTION_EMOJI, EMOTION_KOREAN } from '$lib/constants';
	import { journalCreationStore } from '$lib/stores/journalCreation.svelte';
	import type { UsageInfo } from '$lib/types';

	let { data } = $props();

	// 닉네임 (로컬)
	let nickname = $state('');

	// 사용량 정보
	let usageInfo = $state<UsageInfo | null>(null);

	// Confirm 모달 상태
	let showConfirmModal = $state(false);

	// 전역 스토어에서 파생된 상태
	let pageStatus = $derived(journalCreationStore.status);
	let errorStep = $derived(journalCreationStore.errorStep);
	let errorMessage = $derived(journalCreationStore.errorMessage);
	let transcript = $derived(journalCreationStore.transcript);
	let audioDuration = $derived(journalCreationStore.audioDuration);
	let analysisResult = $derived(journalCreationStore.analysisResult);
	let imageUrl = $derived(journalCreationStore.imageUrl);

	// 로딩 중 네비게이션 차단
	beforeNavigate(({ cancel }) => {
		if (journalCreationStore.isProcessing) {
			cancel();
			showConfirmModal = true;
		}
	});

	// Confirm 모달 확인
	function handleConfirmLeave() {
		showConfirmModal = false;
		journalCreationStore.reset();
	}

	// Confirm 모달 취소
	function handleCancelLeave() {
		showConfirmModal = false;
	}

	onMount(async () => {
		// 로그인 체크
		if (!data.user) {
			goto('/login');
			return;
		}

		// 온보딩 체크 (로컬스토리지 - 추후 DB로 변경)
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

	// 일기 저장 함수 (성공 여부 반환)
	async function saveJournal(): Promise<boolean> {
		const currentAnalysis = journalCreationStore.analysisResult;
		const currentImageUrl = journalCreationStore.imageUrl;
		const currentTranscript = journalCreationStore.transcript;
		const currentDuration = journalCreationStore.audioDuration;

		if (!currentAnalysis || !currentImageUrl) return false;

		try {
			const res = await fetch('/api/journal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					transcript: currentTranscript,
					summary: currentAnalysis.summary,
					emotion: currentAnalysis.emotion,
					emotionScore: currentAnalysis.emotionScore,
					scene: currentAnalysis.scene,
					characterMessage: currentAnalysis.characterMessage,
					imageUrl: currentImageUrl,
					audioDuration: currentDuration
				})
			});
			const result = await res.json();

			if (result.success) {
				journalCreationStore.setCompleted(result.journal.id);
				return true;
			}
			return false;
		} catch (err) {
			console.error('일기 저장 실패:', err);
			return false;
		}
	}

	// 녹음 완료 핸들러 - 전체 플로우 실행
	async function handleRecordingComplete(blob: Blob, duration: number) {
		journalCreationStore.setTranscript('', duration);
		journalCreationStore.setRecordingBlob(blob);

		// 사용량 체크
		if (usageInfo && !usageInfo.canCreate) {
			handleError('오늘은 여기까지! 내일 다시 이야기 들려줘 🐶');
			return;
		}

		await runJournalFlow('transcribing');
	}

	// ErrorStep 타입 정의
	type ErrorStep = 'transcribing' | 'analyzing' | 'generating' | 'saving' | null;

	// 단계별 일기 생성 플로우
	async function runJournalFlow(startFrom: ErrorStep) {
		try {
			// Step 1: STT (Whisper)
			if (startFrom === 'transcribing') {
				journalCreationStore.setStatus('transcribing');

				const recordingBlob = journalCreationStore.lastRecordingBlob;
				if (!recordingBlob) {
					throw new Error('녹음 데이터가 없어요. 다시 녹음해주세요.');
				}

				const formData = new FormData();
				formData.append('audio', recordingBlob, 'recording.webm');

				const sttRes = await fetch('/api/transcribe', {
					method: 'POST',
					body: formData
				});
				const sttData = await sttRes.json();

				if (!sttData.success) {
					journalCreationStore.setError('transcribing', sttData.message || '음성 인식에 실패했어요');
					return;
				}

				journalCreationStore.setTranscript(sttData.transcript, journalCreationStore.audioDuration);
			}

			// Step 2: GPT 분석
			if (startFrom === 'transcribing' || startFrom === 'analyzing') {
				journalCreationStore.setStatus('analyzing');

				const currentTranscript = journalCreationStore.transcript;
				const analyzeRes = await fetch('/api/analyze', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ transcript: currentTranscript })
				});
				const analyzeData = await analyzeRes.json();

				if (!analyzeData.success) {
					journalCreationStore.setError('analyzing', analyzeData.message || 'AI 분석에 실패했어요');
					return;
				}

				journalCreationStore.setAnalysis({
					scene: analyzeData.scene,
					emotion: analyzeData.emotion,
					emotionScore: analyzeData.emotionScore,
					summary: analyzeData.summary,
					characterMessage: analyzeData.characterMessage
				});
			}

			// Step 3: DALL-E 이미지 생성
			if (startFrom === 'transcribing' || startFrom === 'analyzing' || startFrom === 'generating') {
				journalCreationStore.setStatus('generating');

				const currentAnalysis = journalCreationStore.analysisResult;
				if (!currentAnalysis) {
					journalCreationStore.setError('analyzing', '분석 결과가 없어요. 다시 시도해주세요.');
					return;
				}

				const imageRes = await fetch('/api/generate-image', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						scene: currentAnalysis.scene,
						emotion: currentAnalysis.emotion
					})
				});
				const imageData = await imageRes.json();

				if (!imageData.success) {
					journalCreationStore.setError('generating', imageData.message || '그림 생성에 실패했어요');
					return;
				}

				journalCreationStore.setImage(imageData.imageUrl);
			}

			// Step 4: DB에 저장
			if (startFrom === 'transcribing' || startFrom === 'analyzing' || startFrom === 'generating' || startFrom === 'saving') {
				journalCreationStore.setStatus('saving');
				const saved = await saveJournal();
				if (!saved) {
					journalCreationStore.setError('saving', '저장에 실패했어요');
					return;
				}
			}

			// 사용량 다시 로드
			await loadUsage();

		} catch (err) {
			journalCreationStore.setError(null, err instanceof Error ? err.message : '오류가 발생했어요');
		}
	}

	// 재시도 핸들러
	async function handleRetry() {
		const currentErrorStep = journalCreationStore.errorStep;
		if (!currentErrorStep) {
			journalCreationStore.reset();
			return;
		}
		journalCreationStore.clearError();
		await runJournalFlow(currentErrorStep);
	}

	// 처음부터 다시 시작
	function handleStartOver() {
		journalCreationStore.reset();
	}

	// 다시 시작
	async function resetState() {
		journalCreationStore.reset();
		await loadUsage();
	}

	// 토스트 에러 메시지 (사용량 초과 등)
	let toastMessage = $state('');

	// 에러 핸들러 (토스트용)
	function handleError(message: string) {
		toastMessage = message;
		setTimeout(() => {
			toastMessage = '';
		}, 3000);
	}

</script>

<main class="flex-1 flex flex-col items-center justify-center px-6 pb-8 overflow-y-auto">
	<!-- 토스트 메시지 (사용량 초과 등) -->
	{#if toastMessage && pageStatus === 'idle'}
		<div
			class="fixed top-4 left-4 right-4 bg-red-100 text-red-700 px-4 py-3 rounded-xl text-center z-50"
		>
			{toastMessage}
		</div>
	{/if}

	<!-- 상태별 화면 -->
	{#if pageStatus === 'idle'}
		<!-- 기본 화면: 녹음 대기 -->
		<div class="text-center mb-8 animate-fade-up">
			<div class="relative inline-block mb-4">
				<div class="absolute inset-0 bg-(--color-secondary) rounded-full scale-150 opacity-40"></div>
				<p class="relative text-6xl animate-float">🐶</p>
			</div>
			<h1 class="text-2xl font-semibold mb-2 text-(--color-text)">
				{#if nickname}{nickname},{/if} 오늘 하루
			</h1>
			<p class="text-xl text-(--color-text)">어땠어?</p>
		</div>

		<!-- 사용량 표시 -->
		{#if usageInfo}
			<div class="mb-8 text-center animate-fade-in">
				<div class="inline-flex items-center gap-3 px-5 py-2.5 glass rounded-full text-sm shadow-sm">
					<span class="text-(--color-text-light)">오늘</span>
					<div class="flex gap-1.5">
						{#each Array(usageInfo.limit) as _, i}
							<div class="w-2.5 h-2.5 rounded-full transition-all duration-300 {i < usageInfo.used ? 'bg-(--color-primary) shadow-sm' : 'bg-gray-200'}"></div>
						{/each}
					</div>
					<span class="font-semibold text-(--color-text)">{usageInfo.remaining}번 남음</span>
				</div>
			</div>
		{/if}

		{#if !usageInfo || usageInfo.canCreate}
			<!-- 사용량 정보가 없거나(로딩 중) 생성 가능하면 버튼 표시 -->
			<RecordButton onRecordingComplete={handleRecordingComplete} onError={handleError} />
		{:else}
			<!-- 제한 초과 메시지 -->
			<div class="text-center px-6 animate-fade-up">
				<div class="card p-6 mb-4">
					<div class="text-4xl mb-3">😴</div>
					<p class="text-lg font-semibold mb-2 text-(--color-text)">오늘은 여기까지!</p>
					<p class="text-(--color-text-light)">내일 다시 이야기 들려줘 🐶</p>
				</div>
				<p class="text-sm text-(--color-text-muted)">매일 자정에 초기화돼요</p>
			</div>
		{/if}
	{:else if pageStatus === 'completed' && analysisResult}
		<!-- 완료 화면: 결과 표시 -->
		<div class="w-full max-w-sm animate-fade-up">
			<!-- 이미지 -->
			<div class="relative rounded-2xl overflow-hidden shadow-lg mb-6">
				<img src={imageUrl} alt="오늘의 그림일기" class="w-full aspect-square object-cover" />
				<!-- 감정 뱃지 -->
				<div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
					<span class="text-lg">{EMOTION_EMOJI[analysisResult.emotion] || '😌'}</span>
				</div>
			</div>

			<!-- 감정 태그 -->
			<div class="flex items-center gap-2 mb-3">
				<div class="inline-flex items-center gap-1.5 px-3 py-1 bg-(--color-secondary) rounded-full">
					<span class="text-base">{EMOTION_EMOJI[analysisResult.emotion] || '😌'}</span>
					<span class="text-sm font-medium text-(--color-text)">{EMOTION_KOREAN[analysisResult.emotion] || '평온'}</span>
				</div>
			</div>

			<!-- 요약 -->
			<p class="text-lg font-medium leading-relaxed mb-5 text-(--color-text)">{analysisResult.summary}</p>

			<!-- 캐릭터 메시지 -->
			<div class="bg-linear-to-r from-orange-50 to-amber-50 rounded-2xl p-5 mb-6 border border-orange-100">
				<div class="flex items-start gap-3">
					<span class="text-2xl">🐶</span>
					<p class="text-base leading-relaxed italic text-(--color-text)">"{analysisResult.characterMessage}"</p>
				</div>
			</div>

			<!-- 버튼들 -->
			<div class="flex gap-3">
				<button
					class="flex-1 py-3.5 btn-primary"
					onclick={resetState}
				>
					새 일기 쓰기
				</button>
			</div>
		</div>
	{:else if pageStatus === 'error'}
		<!-- 에러 화면 -->
		<div class="text-center w-full max-w-sm animate-fade-up">
			<div class="relative inline-block mb-4">
				<div class="absolute inset-0 bg-red-100 rounded-full scale-150 opacity-50"></div>
				<p class="relative text-6xl animate-shake">🐻</p>
			</div>
			<div class="card p-6 mb-6 border border-red-100">
				<p class="text-lg font-semibold text-red-600 mb-2">앗, 문제가 생겼어!</p>
				<p class="text-red-500 text-sm mb-4">{errorMessage}</p>

				<!-- 실패한 단계 표시 -->
				{#if errorStep}
					<div class="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full">
						<div class="w-2 h-2 bg-red-400 rounded-full"></div>
						<p class="text-xs text-red-500 font-medium">
							{#if errorStep === 'transcribing'}
								음성 인식 단계에서 실패
							{:else if errorStep === 'analyzing'}
								AI 분석 단계에서 실패
							{:else if errorStep === 'generating'}
								그림 생성 단계에서 실패
							{:else if errorStep === 'saving'}
								저장 단계에서 실패
							{/if}
						</p>
					</div>
				{/if}
			</div>

			<!-- 버튼들 -->
			<div class="flex flex-col gap-3">
				<button
					class="w-full py-3.5 btn-primary"
					onclick={handleRetry}
				>
					다시 시도하기
				</button>
				<button
					class="w-full py-3.5 bg-(--color-secondary) text-(--color-text) rounded-2xl font-medium transition-colors hover:bg-(--color-primary-light)"
					onclick={handleStartOver}
				>
					처음부터 다시 녹음하기
				</button>
			</div>

			<!-- 도움말 -->
			<p class="text-xs text-(--color-text-muted) mt-5">
				계속 문제가 발생하면 잠시 후 다시 시도해주세요
			</p>
		</div>
	{:else}
		<!-- 로딩 화면 -->
		<div class="text-center animate-fade-in">
			<div class="relative inline-block mb-6">
				<div class="absolute inset-0 bg-(--color-secondary) rounded-full scale-150 opacity-40 animate-pulse"></div>
				<p class="relative text-6xl animate-float">🐶</p>
			</div>
			<p class="text-xl font-semibold mb-3 text-(--color-text)">
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
			<!-- 진행 단계 표시 -->
			<div class="flex justify-center gap-2 mb-6">
				<div class="w-2.5 h-2.5 rounded-full {pageStatus === 'transcribing' ? 'bg-(--color-primary) animate-pulse' : 'bg-(--color-primary)'}"></div>
				<div class="w-2.5 h-2.5 rounded-full {pageStatus === 'analyzing' ? 'bg-(--color-primary) animate-pulse' : pageStatus === 'transcribing' ? 'bg-gray-200' : 'bg-(--color-primary)'}"></div>
				<div class="w-2.5 h-2.5 rounded-full {pageStatus === 'generating' ? 'bg-(--color-primary) animate-pulse' : pageStatus === 'transcribing' || pageStatus === 'analyzing' ? 'bg-gray-200' : 'bg-(--color-primary)'}"></div>
				<div class="w-2.5 h-2.5 rounded-full {pageStatus === 'saving' ? 'bg-(--color-primary) animate-pulse' : 'bg-gray-200'}"></div>
			</div>
			<div class="flex justify-center">
				<div class="w-8 h-8 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin"></div>
			</div>
		</div>
	{/if}
</main>

<BottomNav />

<!-- Confirm 모달 -->
<ConfirmModal
	show={showConfirmModal}
	title="잠깐!"
	message={`일기를 만드는 중이에요!
정말 나가시겠어요?

진행 중인 작업이 사라집니다.`}
	confirmText="나갈게요"
	cancelText="계속 작업할게요"
	onConfirm={handleConfirmLeave}
	onCancel={handleCancelLeave}
/>
