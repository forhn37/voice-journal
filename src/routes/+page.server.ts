import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { redirect } from '@sveltejs/kit';

// 스트릭 계산 함수
async function calculateStreak(userId: string): Promise<number> {
	// 일기가 있는 날짜들을 조회 (최근 순)
	const { data: journals } = await supabaseAdmin
		.from('journals')
		.select('created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (!journals || journals.length === 0) {
		return 0;
	}

	// 날짜별로 그룹화 (중복 제거)
	const journalDates = new Set<string>();
	for (const journal of journals) {
		const date = new Date(journal.created_at);
		const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
		journalDates.add(dateStr);
	}

	// 오늘 날짜
	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	// 어제 날짜
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

	// 오늘 또는 어제부터 시작해서 연속 일수 계산
	let streak = 0;
	let checkDate = new Date(today);

	// 오늘 일기가 없으면 어제부터 체크
	if (!journalDates.has(todayStr)) {
		if (!journalDates.has(yesterdayStr)) {
			// 어제도 없으면 스트릭 0
			return 0;
		}
		checkDate = yesterday;
	}

	// 연속 일수 계산
	while (true) {
		const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

		if (journalDates.has(dateStr)) {
			streak++;
			checkDate.setDate(checkDate.getDate() - 1);
		} else {
			break;
		}
	}

	return streak;
}

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		throw redirect(303, '/login');
	}

	// 유저 정보 조회 (daily_usage 포함)
	const { data: userProfile } = await supabaseAdmin
		.from('users')
		.select('nickname, notification_time, streak_count, last_journal_date, daily_usage_count, daily_usage_date')
		.eq('id', user.id)
		.single();

	// 유저 정보가 없으면 온보딩으로 리다이렉트
	if (!userProfile) {
		throw redirect(303, '/onboarding');
	}

	// 오늘 날짜
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	// 사용량 조회 (날짜가 바뀌면 리셋)
	let used = 0;
	if (userProfile.daily_usage_date === todayStr) {
		used = userProfile.daily_usage_count || 0;
	}
	const limit = 3;

	// 스트릭 계산 (캐시된 값 활용 또는 재계산)
	let streak = userProfile.streak_count || 0;
	const lastJournalDate = userProfile.last_journal_date;

	// 어제 날짜 문자열
	const yesterdayDate = new Date(today);
	yesterdayDate.setDate(yesterdayDate.getDate() - 1);
	const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

	// 캐시된 스트릭이 유효한지 확인 (오늘 또는 어제 마지막 기록이어야 함)
	if (lastJournalDate !== todayStr && lastJournalDate !== yesterdayStr) {
		// 캐시가 오래됨 - 재계산 필요
		streak = await calculateStreak(user.id);
	}

	return {
		profile: { nickname: userProfile.nickname, notification_time: userProfile.notification_time },
		usage: {
			used,
			limit,
			remaining: Math.max(0, limit - used),
			canCreate: used < limit
		},
		streak
	};
};
