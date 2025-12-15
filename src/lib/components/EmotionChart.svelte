<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
	import { EMOTION_EMOJI, EMOTION_KOREAN } from '$lib/constants';
	import type { EmotionDistribution, Emotion } from '$lib/types';

	let { emotionDistribution } = $props<{
		emotionDistribution: EmotionDistribution;
	}>();

	let canvasRef: HTMLCanvasElement;
	let chartInstance: Chart | null = null;

	// 감정별 색상
	const EMOTION_COLORS: Record<Emotion, string> = {
		joy: '#FFD700',
		sadness: '#87CEEB',
		anger: '#FF6B6B',
		fear: '#9370DB',
		anxiety: '#DDA0DD',
		neutral: '#C0C0C0'
	};

	onMount(() => {
		// Chart.js 컴포넌트 등록
		Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

		// 데이터 준비
		const emotions: Emotion[] = ['joy', 'sadness', 'anger', 'fear', 'anxiety', 'neutral'];
		const labels = emotions.map((e) => `${EMOTION_EMOJI[e]} ${EMOTION_KOREAN[e]}`);
		const data = emotions.map((e) => emotionDistribution[e]);
		const colors = emotions.map((e) => EMOTION_COLORS[e]);

		// 차트 생성
		const ctx = canvasRef.getContext('2d');
		if (!ctx) return;

		chartInstance = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels,
				datasets: [
					{
						data,
						backgroundColor: colors,
						borderWidth: 2,
						borderColor: '#FFFFFF'
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							padding: 16,
							font: {
								size: 13
							},
							usePointStyle: true,
							pointStyle: 'circle'
						}
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								const label = context.label || '';
								const value = context.parsed || 0;
								const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
								const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
								return `${label}: ${value}회 (${percentage}%)`;
							}
						}
					}
				}
			}
		});

		// cleanup
		return () => {
			if (chartInstance) {
				chartInstance.destroy();
			}
		};
	});
</script>

<div class="relative w-full max-w-sm mx-auto">
	<canvas bind:this={canvasRef}></canvas>
</div>
