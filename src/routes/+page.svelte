<script lang="ts">
	import { goto, beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import RecordButton from '$lib/components/RecordButton.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import TimeCapsule from '$lib/components/TimeCapsule.svelte';
	import { EMOTION_EMOJI, EMOTION_KOREAN } from '$lib/constants';
	import { journalCreationStore } from '$lib/stores/journalCreation.svelte';
	import type { UsageInfo, Journal } from '$lib/types';

	let { data } = $props();

	// 서버에서 미리 로드된 데이터
	let nickname = $state(data.profile?.nickname || '');
	let usageInfo = $state<UsageInfo>(data.usage);
	let streak = $state(data.streak || 0);

	// 타임캡슐 (1년 전 오늘)
	let timeCapsuleJournal = $state<Journal | null>(null);
	let timeCapsuleDate = $state<string>('');

	// 타임캡슐 로드
	async function loadTimeCapsule() {
		if (!browser) return;

		try {
			const res = await fetch('/api/timecapsule');
			const data = await res.json();
			if (data.success && data.journal) {
				timeCapsuleJournal = data.journal;
				timeCapsuleDate = data.oneYearAgoDate;
			}
		} catch (err) {
			console.error('타임캡슐 조회 실패:', err);
		}
	}

	onMount(() => {
		loadTimeCapsule();
	});

	// 스트릭 마일스톤 계산
	function getStreakMilestone(days: number): { next: number; emoji: string } | null {
		const milestones = [7, 30, 100, 365];
		for (const m of milestones) {
			if (days < m) {
				return { next: m, emoji: m === 7 ? '🔥' : m === 30 ? '⭐' : m === 100 ? '💎' : '👑' };
			}
		}
		return null;
	}

	let streakMilestone = $derived(getStreakMilestone(streak));

	// Confirm 모달 상태
	let showConfirmModal = $state(false);

	// 전역 스토어에서 파생된 상태
	let pageStatus = $derived(journalCreationStore.status);
	let errorStep = $derived(journalCreationStore.errorStep);
	let errorMessage = $derived(journalCreationStore.errorMessage);
	let analysisResult = $derived(journalCreationStore.analysisResult);
	let imageUrl = $derived(journalCreationStore.imageUrl);

	// 로딩 중 네비게이션 차단
	beforeNavigate(({ cancel }) => {
		if (journalCreationStore.isProcessing) {
			cancel();
			showConfirmModal = true;
		}
	});

	// Confirm 모달 - 나가기
	function handleConfirmLeave() {
		showConfirmModal = false;
		journalCreationStore.reset();
	}

	// Confirm 모달 - 취소 (계속 기다리기)
	function handleCancelLeave() {
		showConfirmModal = false;
	}

	// 사용량 및 스트릭 로드 (일기 생성 후 갱신용)
	async function loadUsage() {
		if (!browser) return;

		try {
			const res = await fetch('/api/usage');
			const result = await res.json();
			if (result.success) {
				usageInfo = {
					used: result.used,
					limit: result.limit,
					remaining: result.remaining,
					canCreate: result.canCreate
				};
				// 스트릭도 갱신
				if (result.streak !== undefined) {
					streak = result.streak;
				}
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
			// 저장 실패 시 에러 로그
			console.error('일기 저장 API 실패:', result);
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

		// 사용량 체크 (녹음 시작 시점에서도 체크하지만, 안전장치로 유지)
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

			// Step 4: 미리보기 상태로 전환 (사용자가 저장 여부 선택)
			if (startFrom === 'transcribing' || startFrom === 'analyzing' || startFrom === 'generating') {
				journalCreationStore.setPreview();
			}

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

	// 다시 시작 (녹음 화면으로)
	async function resetState() {
		journalCreationStore.reset();
		await loadUsage();
	}

	// 일기 저장하기 (미리보기에서 호출)
	async function handleSaveJournal() {
		journalCreationStore.setStatus('saving');
		const saved = await saveJournal();
		if (!saved) {
			journalCreationStore.setError('saving', '저장에 실패했어요');
			return;
		}
		// 사용량 다시 로드
		await loadUsage();
	}

	// 일기 다시 쓰기 (저장 안 하고 녹음 화면으로)
	async function handleDiscardJournal() {
		journalCreationStore.reset();
		await loadUsage(); // 사용량 다시 로드 (API 호출로 이미 카운트됨)
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

		<!-- 타임캡슐 (1년 전 오늘) -->
		<div class="w-full max-w-md px-4 mb-6">
			{#if timeCapsuleJournal && timeCapsuleDate}
				<TimeCapsule journal={timeCapsuleJournal} oneYearAgoDate={timeCapsuleDate} />
			{/if}
		</div>

		<!-- 스트릭 & 사용량 표시 -->
		<div class="mb-8 text-center animate-fade-in">
			<div class="flex flex-col items-center gap-3">
				<!-- 스트릭 표시 -->
				{#if streak > 0}
					<div class="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-orange-100 to-amber-100 rounded-full shadow-sm border border-orange-200">
						<span class="text-xl">🔥</span>
						<span class="font-bold text-orange-600">{streak}일</span>
						<span class="text-sm text-orange-500">연속!</span>
						{#if streakMilestone}
							<span class="text-xs text-orange-400 ml-1">→ {streakMilestone.next}일 {streakMilestone.emoji}</span>
						{/if}
					</div>
				{/if}

				<!-- 사용량 표시 -->
				{#if usageInfo}
					<div class="inline-flex items-center gap-3 px-5 py-2.5 glass rounded-full text-sm shadow-sm">
						<span class="text-(--color-text-light)">오늘</span>
						<div class="flex gap-1.5">
							{#each Array(usageInfo.limit) as _, i}
								<div class="w-2.5 h-2.5 rounded-full transition-all duration-300 {i < usageInfo.used ? 'bg-(--color-primary) shadow-sm' : 'bg-gray-200'}"></div>
							{/each}
						</div>
						<span class="font-semibold text-(--color-text)">{usageInfo.remaining}번 남음</span>
					</div>
				{/if}
			</div>
		</div>

		{#if !usageInfo || usageInfo.canCreate}
			<!-- 사용량 정보가 없거나(로딩 중) 생성 가능하면 버튼 표시 -->
			<RecordButton
				onRecordingComplete={handleRecordingComplete}
				onError={handleError}
				canRecord={usageInfo?.canCreate ?? true}
			/>
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
	{:else if pageStatus === 'preview' && analysisResult}
		<!-- 미리보기 화면: 저장 전 확인 -->
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

			<!-- 버튼들: 저장 / 다시쓰기 -->
			<div class="flex flex-col gap-3">
				<button
					class="w-full py-3.5 btn-primary"
					onclick={handleSaveJournal}
				>
					일기 저장해요!
				</button>
				<button
					class="w-full py-3.5 bg-(--color-secondary) text-(--color-text) rounded-2xl font-medium transition-colors hover:bg-(--color-primary-light)"
					onclick={handleDiscardJournal}
				>
					일기 다시쓸래요~
				</button>
			</div>
		</div>
	{:else if pageStatus === 'completed' && analysisResult}
		<!-- 완료 화면: 저장 완료 -->
		<div class="w-full max-w-sm animate-fade-up">
			<!-- 완료 메시지 -->
			<div class="text-center mb-6">
				<div class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
					<span>✅</span>
					<span class="font-medium">일기가 저장되었어요!</span>
				</div>
			</div>

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

			<!-- 버튼: 캘린더로 이동 또는 새 일기 -->
			<div class="flex gap-3">
				<button
					class="flex-1 py-3.5 bg-(--color-secondary) text-(--color-text) rounded-2xl font-medium transition-colors hover:bg-(--color-primary-light)"
					onclick={() => goto('/calendar')}
				>
					캘린더 보기
				</button>
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

<!-- 로딩 중 이탈 방지 모달 -->
<ConfirmModal
	show={showConfirmModal}
	title="일기 그리는 중! 🎨"
	message={`조금만 기다려줘~
약 20초 정도 걸려요.

지금 나가면 작업이 사라져요.`}
	confirmText="나갈게요"
	cancelText="기다릴게요"
	onConfirm={handleConfirmLeave}
	onCancel={handleCancelLeave}
/>
