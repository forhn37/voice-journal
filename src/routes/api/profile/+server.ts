import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

// 프로필 조회
export const GET: RequestHandler = async ({ locals }) => {
	try {
		const { user } = await locals.safeGetSession();
		if (!user) {
			return json(
				{ success: false, error: 'UNAUTHORIZED', message: '로그인이 필요해요' },
				{ status: 401 }
			);
		}

		const { data, error } = await supabaseAdmin
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		if (error) {
			// 프로필이 없으면 null 반환 (온보딩 필요)
			if (error.code === 'PGRST116') {
				return json({ success: true, profile: null });
			}
			throw error;
		}

		return json({ success: true, profile: data });
	} catch (error) {
		console.error('프로필 조회 오류:', error);
		return json(
			{ success: false, error: 'PROFILE_ERROR', message: '프로필을 불러올 수 없어요' },
			{ status: 500 }
		);
	}
};

// 프로필 생성/업데이트
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { user } = await locals.safeGetSession();
		if (!user) {
			return json(
				{ success: false, error: 'UNAUTHORIZED', message: '로그인이 필요해요' },
				{ status: 401 }
			);
		}

		const { nickname, notificationTime } = await request.json();

		if (!nickname || nickname.trim().length === 0) {
			return json(
				{ success: false, error: 'INVALID_INPUT', message: '닉네임을 입력해주세요' },
				{ status: 400 }
			);
		}

		// upsert: 있으면 업데이트, 없으면 생성
		const { data, error } = await supabaseAdmin
			.from('profiles')
			.upsert({
				id: user.id,
				nickname: nickname.trim(),
				notification_time: notificationTime || null,
				updated_at: new Date().toISOString()
			})
			.select()
			.single();

		if (error) {
			console.error('프로필 저장 Supabase 오류:', {
				message: error.message,
				code: error.code,
				details: error.details,
				hint: error.hint
			});
			throw error;
		}

		return json({ success: true, profile: data });
	} catch (error) {
		console.error('프로필 저장 오류:', error);
		return json(
			{ success: false, error: 'PROFILE_ERROR', message: '프로필 저장에 실패했어요' },
			{ status: 500 }
		);
	}
};
