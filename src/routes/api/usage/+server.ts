import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { DAILY_LIMIT } from '$lib/constants';

// 스트릭 계산 함수
async function calculateStreak(userId: string): Promise<number> {
	const { data: journals } = await supabaseAdmin
		.from('journals')
		.select('created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (!journals || journals.length === 0) {
		return 0;
	}

	// 날짜별로 그룹화
	const journalDates = new Set<string>();
	for (const journal of journals) {
		const date = new Date(journal.created_at);
		const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
		journalDates.add(dateStr);
	}

	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

	let streak = 0;
	let checkDate = new Date(today);

	if (!journalDates.has(todayStr)) {
		if (!journalDates.has(yesterdayStr)) {
			return 0;
		}
		checkDate = yesterday;
	}

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

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// 세션에서 user_id 가져오기
		const { user } = await locals.safeGetSession();
		if (!user) {
			return json(
				{ success: false, error: 'UNAUTHORIZED', message: '로그인이 필요해요' },
				{ status: 401 }
			);
		}

		const userId = user.id;

		// 오늘 날짜 문자열
		const today = new Date();
		const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

		// users 테이블에서 daily_usage_count 조회
		const { data: userData, error } = await supabaseAdmin
			.from('users')
			.select('daily_usage_count, daily_usage_date, streak_count')
			.eq('id', userId)
			.single();

		if (error) {
			console.error('사용량 조회 오류:', error);
			throw error;
		}

		// 날짜가 바뀌면 카운트 리셋
		let usedCount = 0;
		if (userData && userData.daily_usage_date === todayStr) {
			usedCount = userData.daily_usage_count || 0;
		}

		const remainingCount = Math.max(0, DAILY_LIMIT - usedCount);
		const canCreate = usedCount < DAILY_LIMIT;

		// 캐시된 스트릭 사용 (없으면 계산)
		let streak = userData?.streak_count || 0;
		if (!userData?.streak_count) {
			streak = await calculateStreak(userId);
		}

		return json({
			success: true,
			used: usedCount,
			limit: DAILY_LIMIT,
			remaining: remainingCount,
			canCreate,
			streak
		});
	} catch (error) {
		console.error('사용량 체크 오류:', error);
		return json(
			{
				success: false,
				error: 'USAGE_CHECK_ERROR',
				message: '사용량을 확인할 수 없어요'
			},
			{ status: 500 }
		);
	}
};
