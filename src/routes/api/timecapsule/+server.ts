import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// 세션 확인
		const { user } = await locals.safeGetSession();
		if (!user) {
			return json(
				{ success: false, error: 'UNAUTHORIZED', message: '로그인이 필요해요' },
				{ status: 401 }
			);
		}

		const userId = user.id;

		// 1년 전 오늘 날짜 계산
		const today = new Date();
		const oneYearAgo = new Date(today);
		oneYearAgo.setFullYear(today.getFullYear() - 1);

		// 1년 전 날짜 문자열 (YYYY-MM-DD)
		const oneYearAgoStr = `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(2, '0')}-${String(oneYearAgo.getDate()).padStart(2, '0')}`;

		// 다음 날 (범위 검색용)
		const nextDay = new Date(oneYearAgo);
		nextDay.setDate(nextDay.getDate() + 1);
		const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;

		// 1년 전 오늘의 일기 조회
		const { data: journals, error } = await supabaseAdmin
			.from('journals')
			.select('*')
			.eq('user_id', userId)
			.gte('created_at', oneYearAgoStr)
			.lt('created_at', nextDayStr)
			.order('created_at', { ascending: false })
			.limit(1);

		if (error) {
			console.error('타임캡슐 조회 오류:', error);
			throw error;
		}

		// 일기가 있으면 반환, 없으면 null
		const journal = journals && journals.length > 0 ? journals[0] : null;

		return json({
			success: true,
			journal,
			oneYearAgoDate: oneYearAgoStr
		});
	} catch (error) {
		console.error('타임캡슐 API 오류:', error);
		return json(
			{
				success: false,
				error: 'TIMECAPSULE_ERROR',
				message: '타임캡슐을 불러올 수 없어요'
			},
			{ status: 500 }
		);
	}
};
