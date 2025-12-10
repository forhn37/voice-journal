import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import type { LayoutLoad } from '../routes/$types';

// 브라우저용 클라이언트 (싱글턴)
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
	if (!browserClient) {
		browserClient = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);
	}
	return browserClient;
}

// 서버 클라이언트 생성 (hooks.server.ts에서 사용)
export function createSupabaseServerClient(
	cookies: {
		getAll: () => { name: string; value: string }[];
		setAll: (cookies: { name: string; value: string; options?: object }[]) => void;
	}
) {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll() {
				return cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookies.setAll(cookiesToSet.map(({ name, value, options }) => ({
					name,
					value,
					options: {
						...options,
						path: '/',
						secure: process.env.NODE_ENV === 'production',
						sameSite: 'lax' as const,
						httpOnly: true
					}
				})));
			}
		}
	});
}

// 타입 re-export
export type { Journal, UserProfile } from '$lib/types';
