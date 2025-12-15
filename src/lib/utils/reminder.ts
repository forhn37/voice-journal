/**
 * 리마인더 유틸리티
 * 브라우저 알림 스케줄링 및 권한 관리
 */

export type NotificationSchedule = {
	time: string; // HH:MM 형식
	enabled: boolean;
};

/**
 * 알림 권한 확인
 */
export function checkNotificationPermission(): NotificationPermission {
	if (!('Notification' in window)) {
		return 'denied';
	}
	return Notification.permission;
}

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<boolean> {
	if (!('Notification' in window)) {
		return false;
	}

	const permission = await Notification.requestPermission();
	return permission === 'granted';
}

/**
 * 알림 스케줄링
 */
export function scheduleNotification(time: string): void {
	// 기존 스케줄 취소
	cancelNotification();

	const [hour, minute] = time.split(':').map(Number);
	const now = new Date();
	const scheduledTime = new Date();
	scheduledTime.setHours(hour, minute, 0, 0);

	// 이미 지난 시간이면 내일로 설정
	if (scheduledTime <= now) {
		scheduledTime.setDate(scheduledTime.getDate() + 1);
	}

	const delay = scheduledTime.getTime() - now.getTime();

	// 타이머 설정
	const timerId = setTimeout(() => {
		showNotification();
		// 다음날 알림 스케줄링
		scheduleNotification(time);
	}, delay) as unknown as number;

	// localStorage에 저장 (브라우저 재시작 시 복원용)
	if (typeof window !== 'undefined') {
		localStorage.setItem('notification_timer_id', String(timerId));
		localStorage.setItem('notification_time', time);
	}
}

/**
 * 알림 취소
 */
export function cancelNotification(): void {
	if (typeof window === 'undefined') return;

	const timerId = localStorage.getItem('notification_timer_id');
	if (timerId) {
		clearTimeout(Number(timerId));
		localStorage.removeItem('notification_timer_id');
	}
}

/**
 * 알림 표시
 */
export function showNotification(): void {
	if (checkNotificationPermission() !== 'granted') return;

	new Notification('오늘 하루 어땠어?', {
		body: '일기를 작성하고 감정을 기록해보세요',
		icon: '/icon-192.png',
		badge: '/icon-192.png',
		tag: 'daily-reminder',
		requireInteraction: false
	});
}

/**
 * 초기화: 저장된 알림 시간이 있으면 스케줄링
 */
export function initializeReminder(): void {
	if (typeof window === 'undefined') return;

	const savedTime = localStorage.getItem('notification_time');
	if (savedTime && checkNotificationPermission() === 'granted') {
		scheduleNotification(savedTime);
	}
}
