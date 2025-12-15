<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import {
		checkNotificationPermission,
		requestNotificationPermission,
		scheduleNotification,
		cancelNotification
	} from '$lib/utils/reminder';

	let { data } = $props();

	// 프로필 정보 (서버에서 미리 로드됨)
	let nickname = $state(data.profile?.nickname || '');
	let email = $state(data.user?.email || '');
	let isEditing = $state(false);
	let editNickname = $state('');
	let isSaving = $state(false);

	// 리마인더 설정
	let notificationTime = $state(data.profile?.notification_time || '21:00');
	let notificationEnabled = $state(!!data.profile?.notification_time);
	let notificationPermission = $state<NotificationPermission>('default');

	// 로그아웃 모달
	let showLogoutModal = $state(false);

	// 알림 권한 확인
	onMount(() => {
		notificationPermission = checkNotificationPermission();
	});

	// 닉네임 수정 시작
	function startEditing() {
		editNickname = nickname;
		isEditing = true;
	}

	// 닉네임 수정 취소
	function cancelEditing() {
		isEditing = false;
		editNickname = '';
	}

	// 닉네임 저장
	async function saveNickname() {
		if (!editNickname.trim()) return;

		isSaving = true;
		try {
			// DB에 저장
			const res = await fetch('/api/profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nickname: editNickname.trim() })
			});
			const result = await res.json();

			if (result.success) {
				nickname = editNickname.trim();
				isEditing = false;
				// localStorage에도 캐시
				localStorage.setItem('nickname', nickname);
			} else {
				console.error('닉네임 저장 실패:', result.message);
			}
		} catch (err) {
			console.error('닉네임 저장 실패:', err);
		} finally {
			isSaving = false;
		}
	}

	// 리마인더 토글
	async function toggleReminder() {
		if (!notificationEnabled) {
			// 활성화
			let hasPermission = notificationPermission === 'granted';
			if (!hasPermission) {
				hasPermission = await requestNotificationPermission();
				notificationPermission = checkNotificationPermission();
			}

			if (!hasPermission) {
				alert('알림 권한이 거부되었어요. 브라우저 설정에서 알림을 허용해주세요.');
				return;
			}

			// DB에 저장
			const res = await fetch('/api/profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notification_time: notificationTime })
			});
			const result = await res.json();

			if (result.success) {
				notificationEnabled = true;
				scheduleNotification(notificationTime);
			}
		} else {
			// 비활성화
			const res = await fetch('/api/profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notification_time: null })
			});
			const result = await res.json();

			if (result.success) {
				notificationEnabled = false;
				cancelNotification();
			}
		}
	}

	// 리마인더 시간 변경
	async function changeNotificationTime() {
		const res = await fetch('/api/profile', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ notification_time: notificationTime })
		});
		const result = await res.json();

		if (result.success) {
			if (notificationEnabled) {
				scheduleNotification(notificationTime);
			}
		}
	}

	// 로그아웃
	async function handleLogout() {
		try {
			await fetch('/auth/logout', { method: 'POST' });
			// localStorage 정리 (DB에 프로필이 있으므로 재로그인 시 복원됨)
			localStorage.removeItem('nickname');
			localStorage.removeItem('onboarding_completed');
			localStorage.removeItem('notification_time');
			localStorage.removeItem('notification_timer_id');
			goto('/login');
		} catch (err) {
			console.error('로그아웃 실패:', err);
		}
	}
</script>

<main class="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
	<!-- 헤더 -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-(--color-text)">설정</h1>
	</div>

	<!-- 프로필 섹션 -->
	<section class="card p-5 mb-4">
		<h2 class="text-sm font-semibold text-(--color-text-light) mb-4">프로필</h2>

		<!-- 닉네임 -->
		<div class="py-3 border-b border-gray-100">
			<p class="text-sm text-(--color-text-light) mb-2">닉네임</p>
			{#if isEditing}
				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={editNickname}
						class="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-(--color-text) focus:outline-none focus:border-(--color-primary)"
						placeholder="닉네임"
						maxlength="10"
					/>
					<button
						onclick={cancelEditing}
						class="shrink-0 px-4 py-2 text-sm text-(--color-text-light) border border-gray-200 rounded-xl hover:bg-gray-50"
					>
						취소
					</button>
					<button
						onclick={saveNickname}
						disabled={isSaving || !editNickname.trim()}
						class="shrink-0 px-4 py-2 text-sm bg-(--color-primary) text-white rounded-xl disabled:opacity-50"
					>
						{isSaving ? '저장 중...' : '저장'}
					</button>
				</div>
			{:else}
				<div class="flex items-center justify-between">
					<p class="text-base font-medium text-(--color-text)">{nickname || '설정 안함'}</p>
					<button
						onclick={startEditing}
						class="px-3 py-1.5 text-sm text-(--color-primary) hover:bg-(--color-secondary) rounded-lg"
					>
						수정
					</button>
				</div>
			{/if}
		</div>

		<!-- 이메일 -->
		<div class="py-3">
			<p class="text-sm text-(--color-text-light) mb-1">이메일</p>
			<p class="text-base text-(--color-text)">{email}</p>
		</div>
	</section>

	<!-- 리마인더 섹션 -->
	<section class="card p-5 mb-4">
		<h2 class="text-sm font-semibold text-(--color-text-light) mb-4">리마인더</h2>

		<!-- 알림 켜기/끄기 -->
		<div class="py-3 border-b border-gray-100 flex items-center justify-between">
			<div>
				<p class="text-sm font-medium text-(--color-text) mb-1">일기 알림</p>
				<p class="text-xs text-(--color-text-muted)">
					{#if notificationPermission === 'denied'}
						알림이 차단되어 있어요. 브라우저 설정에서 허용해주세요.
					{:else if notificationPermission === 'granted'}
						매일 설정한 시간에 알림을 받아요
					{:else}
						알림 권한이 필요해요
					{/if}
				</p>
			</div>
			<label class="relative inline-flex items-center cursor-pointer">
				<input
					type="checkbox"
					bind:checked={notificationEnabled}
					onchange={toggleReminder}
					disabled={notificationPermission === 'denied'}
					class="sr-only peer"
				/>
				<div
					class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--color-primary) peer-disabled:opacity-50"
				></div>
			</label>
		</div>

		<!-- 알림 시간 설정 -->
		{#if notificationEnabled}
			<div class="py-3">
				<label for="notification-time" class="text-sm text-(--color-text-light) mb-2 block"
					>알림 시간</label
				>
				<div class="flex items-center gap-2">
					<input
						id="notification-time"
						type="time"
						bind:value={notificationTime}
						onchange={changeNotificationTime}
						class="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-(--color-text) focus:outline-none focus:border-(--color-primary)"
					/>
					<span class="text-sm text-(--color-text-muted)">({notificationTime})</span>
				</div>
			</div>
		{/if}
	</section>

	<!-- 앱 정보 섹션 -->
	<section class="card p-5 mb-4">
		<h2 class="text-sm font-semibold text-(--color-text-light) mb-4">앱 정보</h2>

		<div class="py-3 border-b border-gray-100">
			<p class="text-sm text-(--color-text-light) mb-1">버전</p>
			<p class="text-base text-(--color-text)">1.0.0</p>
		</div>

		<div class="py-3">
			<p class="text-sm text-(--color-text-light) mb-1">개발자</p>
			<p class="text-base text-(--color-text)">Voice Journal Team</p>
		</div>
	</section>

	<!-- 법적 문서 섹션 -->
	<section class="card p-5 mb-4">
		<h2 class="text-sm font-semibold text-(--color-text-light) mb-4">법적 문서</h2>

		<a
			href="/legal/privacy-policy"
			class="block py-3 border-b border-gray-100 text-base text-(--color-text) hover:text-(--color-primary) transition-colors"
		>
			개인정보처리방침
		</a>

		<a
			href="/legal/terms-of-service"
			class="block py-3 text-base text-(--color-text) hover:text-(--color-primary) transition-colors"
		>
			이용약관
		</a>
	</section>

	<!-- 계정 관리 섹션 -->
	<section class="card p-5 mb-4">
		<h2 class="text-sm font-semibold text-(--color-text-light) mb-4">계정</h2>

		<button
			onclick={() => showLogoutModal = true}
			class="w-full py-3 text-left text-red-500 hover:bg-red-50 rounded-xl px-3 -mx-3 transition-colors"
		>
			로그아웃
		</button>
	</section>

	<!-- 여백 -->
	<div class="h-4"></div>
</main>

<BottomNav />

<!-- 로그아웃 확인 모달 -->
<ConfirmModal
	show={showLogoutModal}
	title="로그아웃"
	message="정말 로그아웃 하시겠어요?"
	confirmText="로그아웃"
	cancelText="취소"
	onConfirm={handleLogout}
	onCancel={() => showLogoutModal = false}
/>
