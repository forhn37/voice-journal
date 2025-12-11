<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AlertModal from '$lib/components/AlertModal.svelte';

	let { data } = $props();

	// 모달 상태
	let showEmailSentModal = $state(false);

	// 폼 상태
	let email = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	let isSignUp = $state(false);
	let loading = $state(false);
	let error = $state('');
	let showPassword = $state(false);
	let showPasswordConfirm = $state(false);

	// 유효성 검사 상태
	let emailError = $state('');
	let passwordError = $state('');
	let passwordConfirmError = $state('');

	// 이메일 형식 검증
	function validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// 비밀번호 유효성 검사
	function validatePassword(password: string): { valid: boolean; message: string } {
		if (password.length < 6) {
			return { valid: false, message: '비밀번호는 6자 이상이어야 해요' };
		}
		if (!/[a-zA-Z]/.test(password)) {
			return { valid: false, message: '영문자를 포함해주세요' };
		}
		if (!/[0-9]/.test(password)) {
			return { valid: false, message: '숫자를 포함해주세요' };
		}
		return { valid: true, message: '' };
	}

	// 실시간 이메일 검증
	function handleEmailBlur() {
		if (email && !validateEmail(email)) {
			emailError = '올바른 이메일 형식이 아니에요';
		} else {
			emailError = '';
		}
	}

	// 실시간 비밀번호 검증
	function handlePasswordBlur() {
		if (password) {
			const result = validatePassword(password);
			passwordError = result.message;
		} else {
			passwordError = '';
		}
	}

	// 실시간 비밀번호 확인 검증
	function handlePasswordConfirmBlur() {
		if (passwordConfirm && password !== passwordConfirm) {
			passwordConfirmError = '비밀번호가 일치하지 않아요';
		} else {
			passwordConfirmError = '';
		}
	}

	// 에러 파라미터 확인
	$effect(() => {
		const errorParam = $page.url.searchParams.get('error');
		if (errorParam === 'auth_callback_error') {
			error = '로그인 중 오류가 발생했어요. 다시 시도해주세요.';
		}
	});

	// 모드 전환 시 폼 전체 초기화
	function switchMode(signUp: boolean) {
		isSignUp = signUp;
		// 입력값 초기화
		email = '';
		password = '';
		passwordConfirm = '';
		// 에러 초기화
		error = '';
		emailError = '';
		passwordError = '';
		passwordConfirmError = '';
		// 비밀번호 보기 상태 초기화
		showPassword = false;
		showPasswordConfirm = false;
	}

	// 폼 제출 전 전체 유효성 검사
	function validateForm(): boolean {
		let isValid = true;

		// 이메일 검증
		if (!email) {
			emailError = '이메일을 입력해주세요';
			isValid = false;
		} else if (!validateEmail(email)) {
			emailError = '올바른 이메일 형식이 아니에요';
			isValid = false;
		} else {
			emailError = '';
		}

		// 비밀번호 검증
		if (!password) {
			passwordError = '비밀번호를 입력해주세요';
			isValid = false;
		} else if (isSignUp) {
			const result = validatePassword(password);
			if (!result.valid) {
				passwordError = result.message;
				isValid = false;
			} else {
				passwordError = '';
			}
		} else {
			passwordError = '';
		}

		// 회원가입 시 비밀번호 확인 검증
		if (isSignUp) {
			if (!passwordConfirm) {
				passwordConfirmError = '비밀번호 확인을 입력해주세요';
				isValid = false;
			} else if (password !== passwordConfirm) {
				passwordConfirmError = '비밀번호가 일치하지 않아요';
				isValid = false;
			} else {
				passwordConfirmError = '';
			}
		}

		return isValid;
	}

	// 이메일 로그인/회원가입
	async function handleEmailAuth() {
		if (!validateForm()) return;

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

				// 이메일 확인 안내 모달 표시
				error = '';
				showEmailSentModal = true;
			} else {
				// 로그인
				const { error: signInError } = await data.supabase.auth.signInWithPassword({
					email,
					password
				});

				if (signInError) throw signInError;

				// 메인 페이지로 이동
				goto('/');
			}
		} catch (e: unknown) {
			const authError = e as { message?: string };
			if (authError.message?.includes('Invalid login credentials')) {
				error = '이메일 또는 비밀번호가 올바르지 않아요';
			} else if (authError.message?.includes('User already registered')) {
				error = '이미 가입된 이메일이에요';
			} else if (authError.message?.includes('Email not confirmed')) {
				error = '이메일 인증이 필요해요. 메일함을 확인해주세요.';
			} else {
				error = authError.message || '오류가 발생했어요';
			}
		} finally {
			loading = false;
		}
	}

	// Google 로그인 (준비 중)
	async function handleGoogleLogin() {
		alert('Google 로그인은 준비 중이에요!');
		// loading = true;
		// error = '';
		// try {
		// 	const { error: googleError } = await data.supabase.auth.signInWithOAuth({
		// 		provider: 'google',
		// 		options: {
		// 			redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
		// 		}
		// 	});
		// 	if (googleError) throw googleError;
		// } catch (e: unknown) {
		// 	const authError = e as { message?: string };
		// 	error = authError.message || 'Google 로그인 중 오류가 발생했어요';
		// 	loading = false;
		// }
	}
</script>

<svelte:head>
	<title>{isSignUp ? '회원가입' : '로그인'} - Voice Journal</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-(--color-background) to-white flex flex-col items-center justify-center p-6">
	<div class="w-full max-w-sm">
		<!-- 로고/타이틀 -->
		<div class="text-center mb-8">
			<div class="text-5xl mb-3">🐶</div>
			<h1 class="text-2xl font-bold text-(--color-text)">Voice Journal</h1>
			<p class="text-(--color-text-light) mt-2">말로 기록하는 그림일기</p>
		</div>

		<!-- 탭 UI -->
		<div class="flex mb-6 bg-(--color-surface) rounded-xl p-1">
			<button
				type="button"
				onclick={() => switchMode(false)}
				class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
					{!isSignUp
						? 'bg-white text-(--color-primary) shadow-sm'
						: 'text-(--color-text-muted) hover:text-(--color-text)'}"
			>
				로그인
			</button>
			<button
				type="button"
				onclick={() => switchMode(true)}
				class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
					{isSignUp
						? 'bg-white text-(--color-primary) shadow-sm'
						: 'text-(--color-text-muted) hover:text-(--color-text)'}"
			>
				회원가입
			</button>
		</div>

		<!-- 에러 메시지 -->
		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
				{error}
			</div>
		{/if}

		<!-- 로그인/회원가입 폼 -->
		<div class="bg-white rounded-2xl shadow-lg p-6">
			<form onsubmit={(e) => { e.preventDefault(); handleEmailAuth(); }}>
				<div class="space-y-4">
					<!-- 이메일 -->
					<div>
						<label for="email" class="block text-sm font-medium text-(--color-text) mb-1.5">
							이메일
						</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							onblur={handleEmailBlur}
							placeholder="email@example.com"
							class="w-full px-4 py-3 border rounded-xl outline-none transition
								{emailError
									? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400'
									: 'border-gray-200 focus:ring-2 focus:ring-(--color-primary-light) focus:border-(--color-primary)'}"
							disabled={loading}
						/>
						{#if emailError}
							<p class="text-red-500 text-xs mt-1.5">{emailError}</p>
						{/if}
					</div>

					<!-- 비밀번호 -->
					<div>
						<label for="password" class="block text-sm font-medium text-(--color-text) mb-1.5">
							비밀번호
						</label>
						<div class="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								bind:value={password}
								onblur={handlePasswordBlur}
								placeholder={isSignUp ? '영문 + 숫자 조합 6자 이상' : '비밀번호 입력'}
								class="w-full px-4 py-3 pr-12 border rounded-xl outline-none transition
									{passwordError
										? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400'
										: 'border-gray-200 focus:ring-2 focus:ring-(--color-primary-light) focus:border-(--color-primary)'}"
								disabled={loading}
							/>
							<button
								type="button"
								onclick={() => showPassword = !showPassword}
								class="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text) p-1"
								tabindex={-1}
							>
								{#if showPassword}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
									</svg>
								{:else}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
									</svg>
								{/if}
							</button>
						</div>
						{#if passwordError}
							<p class="text-red-500 text-xs mt-1.5">{passwordError}</p>
						{/if}
					</div>

					<!-- 비밀번호 확인 (회원가입 시만) - 애니메이션으로 부드럽게 전환 -->
					<div
						class="grid transition-all duration-300 ease-out"
						style="grid-template-rows: {isSignUp ? '1fr' : '0fr'};"
					>
						<div class="overflow-hidden">
							<div class="pt-0 {isSignUp ? '' : 'invisible'}">
								<label for="passwordConfirm" class="block text-sm font-medium text-(--color-text) mb-1.5">
									비밀번호 확인
								</label>
								<div class="relative">
									<input
										type={showPasswordConfirm ? 'text' : 'password'}
										id="passwordConfirm"
										bind:value={passwordConfirm}
										onblur={handlePasswordConfirmBlur}
										placeholder="비밀번호를 다시 입력해주세요"
										class="w-full px-4 py-3 pr-12 border rounded-xl outline-none transition
											{passwordConfirmError
												? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400'
												: 'border-gray-200 focus:ring-2 focus:ring-(--color-primary-light) focus:border-(--color-primary)'}"
										disabled={loading || !isSignUp}
										tabindex={isSignUp ? 0 : -1}
									/>
									<button
										type="button"
										onclick={() => showPasswordConfirm = !showPasswordConfirm}
										class="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text) p-1"
										tabindex={-1}
									>
										{#if showPasswordConfirm}
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
											</svg>
										{:else}
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
											</svg>
										{/if}
									</button>
								</div>
								{#if passwordConfirmError && isSignUp}
									<p class="text-red-500 text-xs mt-1.5">{passwordConfirmError}</p>
								{/if}
							</div>
						</div>
					</div>

					<!-- 제출 버튼 -->
					<button
						type="submit"
						class="w-full bg-(--color-primary) text-white py-3.5 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						disabled={loading}
					>
						{#if loading}
							<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{/if}
						{isSignUp ? '회원가입' : '로그인'}
					</button>
				</div>
			</form>

			<!-- 구분선 -->
			<div class="relative my-6">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-100"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-3 bg-white text-(--color-text-muted)">또는</span>
				</div>
			</div>

			<!-- Google 로그인 (준비 중) -->
			<button
				onclick={handleGoogleLogin}
				class="w-full flex items-center justify-center gap-3 bg-gray-50 border border-gray-200 py-3.5 rounded-xl font-medium text-(--color-text-muted) cursor-not-allowed opacity-60"
				disabled
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24">
					<path fill="#9CA3AF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="#9CA3AF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#9CA3AF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="#9CA3AF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				Google 로그인 (준비 중)
			</button>

			<!-- 하단 안내 -->
			{#if isSignUp}
				<p class="text-center text-xs text-(--color-text-muted) mt-6">
					가입 시 <span class="underline">이용약관</span> 및 <span class="underline">개인정보처리방침</span>에 동의하게 됩니다.
				</p>
			{:else}
				<p class="text-center text-xs text-(--color-text-muted) mt-6">
					비밀번호를 잊으셨나요? <button type="button" class="underline">비밀번호 찾기</button>
				</p>
			{/if}
		</div>
	</div>
</div>

<!-- 이메일 전송 완료 모달 -->
<AlertModal
	show={showEmailSentModal}
	title="이메일을 확인해주세요"
	message="가입 확인 이메일을 보냈어요!
메일함에서 인증 링크를 클릭해주세요."
	confirmText="확인"
	icon="📧"
	onConfirm={() => {
		showEmailSentModal = false;
		switchMode(false); // 로그인 탭으로 전환
	}}
/>
