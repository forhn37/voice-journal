import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { DAILY_LIMIT } from '$lib/constants';

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

		// 오늘 00:00:00 시작 시간
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// 오늘 작성된 일기 개수 조회 (해당 유저만)
		const { count, error } = await supabaseAdmin
			.from('journals')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', userId)
			.gte('created_at', today.toISOString());

		if (error) {
			console.error('사용량 조회 오류:', error);
			throw error;
		}

		const usedCount = count || 0;
		const remainingCount = Math.max(0, DAILY_LIMIT - usedCount);
		const canCreate = usedCount < DAILY_LIMIT;

		return json({
			success: true,
			used: usedCount,
			limit: DAILY_LIMIT,
			remaining: remainingCount,
			canCreate
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
