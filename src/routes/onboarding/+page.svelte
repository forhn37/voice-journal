<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let { data } = $props();

	let step = $state(1);
	let nickname = $state('');
	let notificationTime = $state('21:00');
	let loading = $state(false);
	let error = $state('');

	// 로그인 체크
	onMount(() => {
		if (!data.user) {
			goto('/login');
		}
	});

	// 온보딩 완료 처리
	async function completeOnboarding() {
		loading = true;
		error = '';

		try {
			// Supabase에 프로필 저장
			const res = await fetch('/api/profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nickname: nickname.trim(),
					notificationTime: notificationTime || null
				})
			});

			const result = await res.json();

			if (!result.success) {
				throw new Error(result.message || '프로필 저장에 실패했어요');
			}

			// 로컬스토리지에도 저장 (빠른 접근용)
			if (browser) {
				localStorage.setItem('onboarding_completed', 'true');
				localStorage.setItem('nickname', nickname);
				localStorage.setItem('notification_time', notificationTime);
			}

			goto('/');
		} catch (e: unknown) {
			const err = e as { message?: string };
			error = err.message || '오류가 발생했어요';
		} finally {
			loading = false;
		}
	}

	function nextStep() {
		if (step < 3) {
			step += 1;
		} else {
			completeOnboarding();
		}
	}

	function skipNotification() {
		notificationTime = '';
		completeOnboarding();
	}
</script>

<main class="flex-1 flex flex-col items-center justify-center px-6">
	<!-- 에러 메시지 -->
	{#if error}
		<div class="fixed top-4 left-4 right-4 bg-red-100 text-red-700 px-4 py-3 rounded-xl text-center z-50">
			{error}
		</div>
	{/if}

	<!-- Step 1: 환영 -->
	{#if step === 1}
		<div class="text-center animate-fade-in">
			<p class="text-8xl mb-6">🐻</p>
			<h1 class="text-2xl font-semibold mb-3">안녕!</h1>
			<p class="text-lg text-(--color-text-light) mb-8">
				나는 너의 일기 친구야
			</p>
			<button
				class="w-full py-4 bg-(--color-primary) text-white rounded-2xl font-medium
					   hover:bg-(--color-primary-dark) transition-colors"
				onclick={nextStep}
			>
				만나서 반가워!
			</button>
		</div>
	{/if}

	<!-- Step 2: 닉네임 -->
	{#if step === 2}
		<div class="text-center w-full max-w-sm animate-fade-in">
			<p class="text-6xl mb-6">🐻</p>
			<h1 class="text-2xl font-semibold mb-2">뭐라고 부르면 될까?</h1>
			<p class="text-(--color-text-light) mb-8">닉네임을 알려줘!</p>

			<input
				type="text"
				bind:value={nickname}
				placeholder="닉네임 입력"
				maxlength="10"
				class="w-full px-4 py-4 text-center text-lg border-2 border-gray-200 rounded-2xl
					   focus:border-(--color-primary) focus:outline-none transition-colors"
			/>

			<button
				class="w-full mt-6 py-4 bg-(--color-primary) text-white rounded-2xl font-medium
					   hover:bg-(--color-primary-dark) transition-colors
					   disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={nextStep}
				disabled={nickname.trim().length === 0}
			>
				다음
			</button>
		</div>
	{/if}

	<!-- Step 3: 알림 시간 -->
	{#if step === 3}
		<div class="text-center w-full max-w-sm animate-fade-in">
			<p class="text-6xl mb-6">🐻</p>
			<h1 class="text-2xl font-semibold mb-2">{nickname}아, 반가워!</h1>
			<p class="text-(--color-text-light) mb-8">언제 일기 쓸까?</p>

			<input
				type="time"
				bind:value={notificationTime}
				class="w-full px-4 py-4 text-center text-lg border-2 border-gray-200 rounded-2xl
					   focus:border-(--color-primary) focus:outline-none transition-colors"
			/>

			<button
				class="w-full mt-6 py-4 bg-(--color-primary) text-white rounded-2xl font-medium
					   hover:bg-(--color-primary-dark) transition-colors
					   disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={nextStep}
				disabled={loading}
			>
				{#if loading}
					<span class="inline-block animate-spin mr-2">⏳</span>
				{/if}
				시작하기
			</button>

			<button
				class="w-full mt-3 py-3 text-(--color-text-light) hover:text-(--color-text)
					   disabled:opacity-50 disabled:cursor-not-allowed"
				onclick={skipNotification}
				disabled={loading}
			>
				나중에 설정할게
			</button>
		</div>
	{/if}
</main>

<!-- 하단 인디케이터 -->
<div class="flex justify-center gap-2 pb-8">
	{#each [1, 2, 3] as s}
		<div
			class="w-2 h-2 rounded-full transition-colors {s === step ? 'bg-(--color-primary)' : 'bg-gray-300'}"
		></div>
	{/each}
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>
