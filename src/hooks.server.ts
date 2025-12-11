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

	// 세션 가져오기 (getUser는 API 호출, getSession은 쿠키에서 읽음)
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		// 토큰 만료 시간 확인
		const expiresAt = session.expires_at ?? 0;
		const now = Math.floor(Date.now() / 1000);
		const hoursUntilExpiry = (expiresAt - now) / 3600;

		// 1시간 이내 만료 예정이면 getUser로 검증 (보안)
		// 아니면 세션 정보만 사용 (성능)
		if (hoursUntilExpiry < 1) {
			const {
				data: { user },
				error
			} = await event.locals.supabase.auth.getUser();

			if (error) {
				return { session: null, user: null };
			}

			return { session, user };
		}

		// 토큰이 충분히 유효하면 API 호출 생략
		return { session, user: session.user };
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
