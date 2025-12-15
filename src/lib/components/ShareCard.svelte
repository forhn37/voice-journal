<script lang="ts">
	import { EMOTION_EMOJI, EMOTION_KOREAN } from '$lib/constants';
	import type { Journal, Emotion } from '$lib/types';

	let { journal, show = $bindable(false) } = $props<{
		journal: Journal;
		show?: boolean;
	}>();

	let isGenerating = $state(false);
	let shareImageUrl = $state<string | null>(null);
	let canvasRef: HTMLCanvasElement;

	// 날짜 포맷팅 (간단 버전)
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		return `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')}`;
	};

	// Canvas로 공유 이미지 생성
	async function generateShareImage() {
		isGenerating = true;

		try {
			const canvas = canvasRef;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다');

			// 캔버스 크기 설정 (1:1 비율, 1080x1080)
			canvas.width = 1080;
			canvas.height = 1080;

			// 배경 (그라데이션)
			const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
			gradient.addColorStop(0, '#FFF8F0');
			gradient.addColorStop(1, '#FFFFFF');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// 원본 이미지 로드
			const img = new Image();
			img.crossOrigin = 'anonymous';

			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
				img.src = journal.image_url;
			});

			// 이미지 그리기 (중앙, 패딩 포함)
			const padding = 80;
			const imageSize = canvas.width - padding * 2;
			const imageY = 60;

			// 이미지 배경 (흰색 카드)
			ctx.fillStyle = '#FFFFFF';
			ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
			ctx.shadowBlur = 20;
			ctx.shadowOffsetY = 4;
			ctx.fillRect(padding - 20, imageY - 20, imageSize + 40, imageSize + 40);
			ctx.shadowColor = 'transparent';

			// 이미지
			ctx.drawImage(img, padding, imageY, imageSize, imageSize);

			// 요약 텍스트 영역
			const textY = imageY + imageSize + 60;

			// 요약 (최대 2줄)
			ctx.fillStyle = '#4A4A4A';
			ctx.font = '600 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
			ctx.textAlign = 'center';

			const maxWidth = canvas.width - padding * 2;
			const lines = wrapText(ctx, journal.summary, maxWidth, 2);

			lines.forEach((line, index) => {
				ctx.fillText(line, canvas.width / 2, textY + index * 45);
			});

			// 감정 + 날짜
			const metaY = textY + lines.length * 45 + 40;
			ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
			ctx.fillStyle = '#999999';
			const emotion = journal.emotion as Emotion;
			const emotionText = `${EMOTION_EMOJI[emotion] || '😌'} ${EMOTION_KOREAN[emotion] || '평온'}`;
			const dateText = formatDate(journal.created_at);
			const metaText = `${emotionText}  |  ${dateText}`;
			ctx.fillText(metaText, canvas.width / 2, metaY);

			// 워터마크 (하단)
			ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
			ctx.fillStyle = '#CCCCCC';
			ctx.fillText('Voice Journal', canvas.width / 2, canvas.height - 50);

			// Canvas를 Blob으로 변환
			canvas.toBlob((blob) => {
				if (blob) {
					shareImageUrl = URL.createObjectURL(blob);
				}
				isGenerating = false;
			}, 'image/png');

		} catch (error) {
			console.error('이미지 생성 실패:', error);
			isGenerating = false;
			alert('이미지 생성에 실패했어요');
		}
	}

	// 텍스트 줄바꿈 헬퍼
	function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
		const words = text.split(' ');
		const lines: string[] = [];
		let currentLine = '';

		for (const word of words) {
			const testLine = currentLine ? `${currentLine} ${word}` : word;
			const metrics = ctx.measureText(testLine);

			if (metrics.width > maxWidth && currentLine) {
				lines.push(currentLine);
				currentLine = word;

				if (lines.length >= maxLines - 1) {
					// 마지막 줄은 ... 처리
					const remaining = words.slice(words.indexOf(word)).join(' ');
					const ellipsis = remaining.length > 30 ? remaining.substring(0, 30) + '...' : remaining;
					lines.push(ellipsis);
					return lines;
				}
			} else {
				currentLine = testLine;
			}
		}

		if (currentLine) {
			lines.push(currentLine);
		}

		return lines.slice(0, maxLines);
	}

	// 다운로드
	async function handleDownload() {
		if (!shareImageUrl) {
			await generateShareImage();
		}

		if (shareImageUrl) {
			const link = document.createElement('a');
			link.href = shareImageUrl;
			link.download = `voice-journal-${formatDate(journal.created_at)}.png`;
			link.click();
		}
	}

	// Web Share API
	async function handleShare() {
		if (!shareImageUrl) {
			await generateShareImage();
		}

		if (!shareImageUrl) return;

		try {
			// Blob 가져오기
			const response = await fetch(shareImageUrl);
			const blob = await response.blob();
			const file = new File([blob], `voice-journal-${formatDate(journal.created_at)}.png`, { type: 'image/png' });

			// Web Share API 지원 확인
			if (navigator.share && navigator.canShare({ files: [file] })) {
				await navigator.share({
					title: 'Voice Journal',
					text: journal.summary.substring(0, 50) + '...',
					files: [file]
				});
			} else {
				// Web Share API 미지원 시 다운로드
				handleDownload();
			}
		} catch (error) {
			console.error('공유 실패:', error);
			// 에러 시 다운로드
			handleDownload();
		}
	}

	// 모달 열릴 때 이미지 생성
	$effect(() => {
		if (show && !shareImageUrl) {
			generateShareImage();
		}
	});

	function closeModal() {
		show = false;
	}
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="button"
		tabindex="-1"
	>
		<div
			class="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto animate-scale-up"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-labelledby="share-modal-title"
			tabindex="0"
		>
			<!-- 헤더 -->
			<div class="flex items-center justify-between p-4 border-b border-gray-200">
				<h2 id="share-modal-title" class="text-lg font-semibold">공유하기</h2>
				<button
					onclick={closeModal}
					class="p-2 hover:bg-gray-100 rounded-full transition-colors"
					aria-label="닫기"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- 미리보기 -->
			<div class="p-6">
				{#if isGenerating}
					<div class="flex flex-col items-center justify-center py-12">
						<div class="w-16 h-16 border-4 border-t-(--color-primary) border-gray-200 rounded-full animate-spin mb-4"></div>
						<p class="text-sm text-(--color-text-light)">이미지 생성 중...</p>
					</div>
				{:else if shareImageUrl}
					<img src={shareImageUrl} alt="공유 이미지" class="w-full rounded-xl shadow-lg mb-4" />
				{/if}

				<!-- 버튼 -->
				<div class="flex gap-3">
					<button
						onclick={handleDownload}
						disabled={isGenerating}
						class="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
						저장
					</button>
					<button
						onclick={handleShare}
						disabled={isGenerating}
						class="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
							/>
						</svg>
						공유
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- 숨겨진 Canvas -->
<canvas bind:this={canvasRef} class="hidden"></canvas>
