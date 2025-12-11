<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { EMOTION_EMOJI, EMOTION_KOREAN } from '$lib/constants';
	import type { Journal } from '$lib/types';

	let { data: pageData } = $props();

	let journal = $state<Journal | null>(null);
	let isLoading = $state(true);
	let errorMessage = $state('');

	// 삭제 관련 상태
	let showDeleteModal = $state(false);
	let isDeleting = $state(false);

	// 날짜 포맷팅
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
		const hours = date.getHours();
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${year}년 ${month}월 ${day}일 (${weekday}) ${hours}:${minutes}`;
	};

	onMount(async () => {
		// 로그인 체크
		if (!pageData.user) {
			goto('/login');
			return;
		}

		const journalId = $page.params.id;

		try {
			const res = await fetch(`/api/journal?id=${journalId}`);
			const data = await res.json();

			if (data.success && data.journal) {
				journal = data.journal;
			} else {
				errorMessage = '일기를 찾을 수 없어요';
			}
		} catch (err) {
			errorMessage = '일기를 불러올 수 없어요';
		} finally {
			isLoading = false;
		}
	});

	function handleBack() {
		goto('/calendar');
	}

	// 일기 삭제
	async function handleDelete() {
		if (!journal) return;

		isDeleting = true;
		try {
			const res = await fetch(`/api/journal?id=${journal.id}`, {
				method: 'DELETE'
			});
			const data = await res.json();

			if (data.success) {
				goto('/calendar');
			} else {
				errorMessage = data.message || '삭제에 실패했어요';
				showDeleteModal = false;
			}
		} catch (err) {
			errorMessage = '삭제 중 오류가 발생했어요';
			showDeleteModal = false;
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>{journal ? '일기 상세' : '로딩 중...'} - Voice Journal</title>
</svelte:head>

<main class="flex-1 flex flex-col">
	<!-- 헤더 -->
	<header class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
		<div class="flex items-center gap-3">
			<button
				onclick={handleBack}
				class="p-2 hover:bg-gray-100 rounded-full transition-colors"
				aria-label="뒤로 가기"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>
			<h1 class="text-lg font-semibold">일기</h1>
		</div>
		{#if journal && !isLoading}
			<button
				onclick={() => showDeleteModal = true}
				class="p-2 hover:bg-red-50 rounded-full transition-colors text-red-400 hover:text-red-500"
				aria-label="삭제"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
			</button>
		{/if}
	</header>

	<!-- 본문 -->
	<div class="flex-1 overflow-auto px-6 py-6">
		{#if isLoading}
			<!-- 스켈레톤 로딩 -->
			<div class="animate-fade-in">
				<!-- 이미지 스켈레톤 -->
				<div class="rounded-2xl overflow-hidden mb-6">
					<div class="w-full aspect-square skeleton"></div>
				</div>
				<!-- 날짜 스켈레톤 -->
				<div class="h-4 w-40 skeleton mb-4"></div>
				<!-- 요약 스켈레톤 -->
				<div class="h-6 w-full skeleton mb-2"></div>
				<div class="h-6 w-3/4 skeleton mb-4"></div>
				<!-- 감정 스켈레톤 -->
				<div class="flex items-center gap-2 mb-6">
					<div class="w-8 h-8 rounded-full skeleton"></div>
					<div class="h-4 w-16 skeleton"></div>
				</div>
				<!-- 전문 스켈레톤 -->
				<div class="bg-white/50 rounded-2xl p-4 mb-6">
					<div class="h-4 w-24 skeleton mb-3"></div>
					<div class="h-4 w-full skeleton mb-2"></div>
					<div class="h-4 w-full skeleton mb-2"></div>
					<div class="h-4 w-2/3 skeleton"></div>
				</div>
			</div>
		{:else if errorMessage}
			<div class="flex flex-col items-center justify-center py-12 animate-fade-up">
				<div class="relative mb-6">
					<div class="absolute inset-0 bg-red-100 rounded-full scale-150 opacity-50"></div>
					<div class="relative text-6xl animate-shake">🐻</div>
				</div>
				<p class="text-lg font-semibold text-(--color-text) mb-2">{errorMessage}</p>
				<button onclick={handleBack} class="mt-4 px-6 py-3 btn-primary">
					캘린더로 돌아가기
				</button>
			</div>
		{:else if journal}
			<div class="animate-fade-up">
				<!-- 이미지 -->
				<div class="relative rounded-2xl overflow-hidden shadow-lg mb-6">
					<img src={journal.image_url} alt="일기 그림" class="w-full aspect-square object-cover" />
					<!-- 감정 뱃지 -->
					<div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
						<span class="text-lg">{EMOTION_EMOJI[journal.emotion] || '😌'}</span>
					</div>
				</div>

				<!-- 날짜 및 감정 -->
				<div class="flex items-center justify-between mb-4">
					<p class="text-sm text-(--color-text-light)">{formatDate(journal.created_at)}</p>
					<div class="flex items-center gap-1.5 px-3 py-1 bg-(--color-secondary) rounded-full">
						<span class="text-base">{EMOTION_EMOJI[journal.emotion] || '😌'}</span>
						<span class="text-sm font-medium text-(--color-text)">{EMOTION_KOREAN[journal.emotion] || '평온'}</span>
					</div>
				</div>

				<!-- 요약 -->
				<p class="text-lg font-medium leading-relaxed mb-6">{journal.summary}</p>

				<!-- 전문 (transcript) -->
				<div class="card p-5 mb-6">
					<p class="text-sm font-semibold text-(--color-primary) mb-3">💬 내가 말한 내용</p>
					<p class="text-base leading-relaxed text-(--color-text)">{journal.transcript}</p>
				</div>

				<!-- 캐릭터 메시지 -->
				{#if journal.character_message}
					<div class="bg-linear-to-r from-orange-50 to-amber-50 rounded-2xl p-5 mb-6 border border-orange-100">
						<div class="flex items-start gap-3">
							<span class="text-2xl">🐶</span>
							<p class="text-base leading-relaxed italic text-(--color-text)">"{journal.character_message}"</p>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</main>

<BottomNav />

<!-- 삭제 확인 모달 -->
<ConfirmModal
	show={showDeleteModal}
	title="일기 삭제"
	message={`이 일기를 삭제할까요?\n삭제하면 다시 복구할 수 없어요`}
	confirmText={isDeleting ? '삭제 중...' : '삭제'}
	cancelText="취소"
	onConfirm={handleDelete}
	onCancel={() => showDeleteModal = false}
/>
