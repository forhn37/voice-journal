import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		throw redirect(303, '/login');
	}

	// 일기 목록 조회 (요약 정보만)
	const { data: journals, error } = await supabaseAdmin
		.from('journals')
		.select('id, created_at, emotion, summary, image_url')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('일기 조회 오류:', error);
	}

	return {
		journals: journals || []
	};
};
