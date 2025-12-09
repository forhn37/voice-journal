// 유저 상태 관리 (Svelte 5 Runes)

import { browser } from '$app/environment';
import type { UserInfo } from '$lib/types';

// 기본값
const defaultUser: UserInfo = {
	nickname: '',
	notificationTime: null,
	onboardingCompleted: false
};

// 로컬스토리지에서 유저 정보 로드
function loadUserFromStorage(): UserInfo {
	if (!browser) return defaultUser;

	const onboardingCompleted = localStorage.getItem('onboarding_completed') === 'true';
	const nickname = localStorage.getItem('nickname') || '';
	const notificationTime = localStorage.getItem('notification_time');

	return {
		nickname,
		notificationTime,
		onboardingCompleted
	};
}

// 유저 상태 (Svelte 5 $state)
export const user = $state<UserInfo>(loadUserFromStorage());

// 유저 정보 저장
export function saveUser(info: Partial<UserInfo>) {
	if (!browser) return;

	if (info.nickname !== undefined) {
		user.nickname = info.nickname;
		localStorage.setItem('nickname', info.nickname);
	}

	if (info.notificationTime !== undefined) {
		user.notificationTime = info.notificationTime;
		if (info.notificationTime) {
			localStorage.setItem('notification_time', info.notificationTime);
		} else {
			localStorage.removeItem('notification_time');
		}
	}

	if (info.onboardingCompleted !== undefined) {
		user.onboardingCompleted = info.onboardingCompleted;
		localStorage.setItem('onboarding_completed', info.onboardingCompleted.toString());
	}
}

// 유저 정보 초기화
export function clearUser() {
	if (!browser) return;

	user.nickname = '';
	user.notificationTime = null;
	user.onboardingCompleted = false;

	localStorage.removeItem('nickname');
	localStorage.removeItem('notification_time');
	localStorage.removeItem('onboarding_completed');
}
