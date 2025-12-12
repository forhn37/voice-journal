import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import { createSupabaseServerClient } from '$lib/supabase';
import type { Handle } from '@sveltejs/kit';

Sentry.init({
	dsn: import.meta.env.PUBLIC_SENTRY_DSN,
	tracesSampleRate: 1.0
});

// Supabase Auth 핸들
const supabaseHandle: Handle = async ({ event, resolve }) => {
	// 서버용 Supabase 클라이언트 생성
	event.locals.supabase = createSupabaseServerClient({
		getAll: () => event.cookies.getAll(),
		setAll: (cookiesToSet) => {
			cookiesToSet.forEach(({ name, value, options }) => {
				const opts = options as { path?: string } | undefined;
				event.cookies.set(name, value, {
					...opts,
					path: opts?.path ?? '/'
				});
			});
		}
	});

	// 세션 가져오기 - 서버사이드에서는 항상 getUser()로 검증
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		// 서버사이드에서는 항상 getUser()로 인증 검증 (Supabase 권장)
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !user) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

// 핸들 체인 (Supabase 먼저, 그 다음 Sentry)
export const handle = sequence(supabaseHandle, sentryHandle());

// 에러 핸들링
export const handleError = handleErrorWithSentry();
