import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// OAuth 콜백 핸들러 (Google 로그인 등)
export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			// 성공: 온보딩 또는 메인으로 이동
			redirect(303, next);
		}
	}

	// 에러 시 로그인 페이지로
	redirect(303, '/login?error=auth_callback_error');
};
