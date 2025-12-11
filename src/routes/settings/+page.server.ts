import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		throw redirect(303, '/login');
	}

	// 유저 정보 조회
	let profile = null;
	try {
		const { data } = await supabaseAdmin
			.from('users')
			.select('nickname, notification_time')
			.eq('id', user.id)
			.single();

		profile = data;
	} catch {
		// 유저 정보 없으면 null
	}

	return {
		profile
	};
};
