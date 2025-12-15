import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ locals, request }) => {
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
		const body = await request.json();

		// 업데이트할 필드들
		const updates: Record<string, string | null> = {};

		if ('nickname' in body) {
			updates.nickname = body.nickname;
		}

		if ('notification_time' in body) {
			updates.notification_time = body.notification_time;
		}

		// DB 업데이트
		const { error } = await supabaseAdmin
			.from('users')
			.update(updates)
			.eq('id', userId);

		if (error) {
			console.error('프로필 업데이트 오류:', error);
			throw error;
		}

		return json({
			success: true,
			message: '프로필이 업데이트되었어요'
		});
	} catch (error) {
		console.error('프로필 API 오류:', error);
		return json(
			{
				success: false,
				error: 'PROFILE_UPDATE_ERROR',
				message: '프로필을 업데이트할 수 없어요'
			},
			{ status: 500 }
		);
	}
};
