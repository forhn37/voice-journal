<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	let email = $state('');
	let password = $state('');
	let isSignUp = $state(false);
	let loading = $state(false);
	let error = $state('');

	// 에러 파라미터 확인
	$effect(() => {
		const errorParam = $page.url.searchParams.get('error');
		if (errorParam === 'auth_callback_error') {
			error = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
		}
	});

	// 이메일 로그인/회원가입
	async function handleEmailAuth() {
		if (!email || !password) {
			error = '이메일과 비밀번호를 입력해주세요.';
			return;
		}

		loading = true;
		error = '';

		try {
			if (isSignUp) {
				// 회원가입
				const { error: signUpError } = await data.supabase.auth.signUp({
					email,
					password,
					options: {
						emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
					}
				});

				if (signUpError) throw signUpError;

				// 이메일 확인 안내
				error = '가입 확인 이메일을 보냈습니다. 이메일을 확인해주세요.';
			} else {
				// 로그인
				const { error: signInError } = await data.supabase.auth.signInWithPassword({
					email,
					password
				});

				if (signInError) throw signInError;

				// 온보딩 완료 여부 확인 후 리다이렉트
				goto('/');
			}
		} catch (e: unknown) {
			const authError = e as { message?: string };
			if (authError.message?.includes('Invalid login credentials')) {
				error = '이메일 또는 비밀번호가 올바르지 않습니다.';
			} else if (authError.message?.includes('User already registered')) {
				error = '이미 가입된 이메일입니다.';
			} else {
				error = authError.message || '오류가 발생했습니다.';
			}
		} finally {
			loading = false;
		}
	}

	// Google 로그인
	async function handleGoogleLogin() {
		loading = true;
		error = '';

		try {
			const { error: googleError } = await data.supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
				}
			});

			if (googleError) throw googleError;
		} catch (e: unknown) {
			const authError = e as { message?: string };
			error = authError.message || 'Google 로그인 중 오류가 발생했습니다.';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{isSignUp ? '회원가입' : '로그인'} - Voice Journal</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-6">
	<div class="w-full max-w-sm">
		<!-- 로고/타이틀 -->
		<div class="text-center mb-8">
			<div class="text-5xl mb-3">📔</div>
			<h1 class="text-2xl font-bold text-gray-900">Voice Journal</h1>
			<p class="text-gray-600 mt-2">말로 기록하는 그림일기</p>
		</div>

		<!-- 에러 메시지 -->
		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
				{error}
			</div>
		{/if}

		<!-- 로그인 폼 -->
		<div class="bg-white rounded-2xl shadow-lg p-6">
			<form onsubmit={(e) => { e.preventDefault(); handleEmailAuth(); }}>
				<div class="space-y-4">
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
							이메일
						</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							placeholder="email@example.com"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
							disabled={loading}
						/>
					</div>

					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
							비밀번호
						</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							placeholder="6자 이상"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
							disabled={loading}
						/>
					</div>

					<button
						type="submit"
						class="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={loading}
					>
						{#if loading}
							<span class="inline-block animate-spin mr-2">⏳</span>
						{/if}
						{isSignUp ? '회원가입' : '로그인'}
					</button>
				</div>
			</form>

			<!-- 구분선 -->
			<div class="relative my-6">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-200"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-3 bg-white text-gray-500">또는</span>
				</div>
			</div>

			<!-- Google 로그인 -->
			<button
				onclick={handleGoogleLogin}
				class="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={loading}
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24">
					<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				Google로 계속하기
			</button>

			<!-- 모드 전환 -->
			<p class="text-center text-sm text-gray-600 mt-6">
				{#if isSignUp}
					이미 계정이 있으신가요?
					<button
						type="button"
						onclick={() => { isSignUp = false; error = ''; }}
						class="text-indigo-600 font-medium hover:underline"
					>
						로그인
					</button>
				{:else}
					계정이 없으신가요?
					<button
						type="button"
						onclick={() => { isSignUp = true; error = ''; }}
						class="text-indigo-600 font-medium hover:underline"
					>
						회원가입
					</button>
				{/if}
			</p>
		</div>
	</div>
</div>
