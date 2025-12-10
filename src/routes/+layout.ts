import { getSupabaseBrowserClient } from '$lib/supabase';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends }) => {
	// 이 키로 invalidate 가능
	depends('supabase:auth');

	const supabase = getSupabaseBrowserClient();

	// 서버에서 전달받은 세션 데이터 사용
	const { session, user } = data;

	return {
		supabase,
		session,
		user
	};
};
