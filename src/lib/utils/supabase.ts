import { createClient } from '@supabase/supabase-js';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_PUBLISHABLE_KEY
} from '$env/static/public';

// 클라이언트용 Supabase 인스턴스 (Publishable Key 사용)
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);

// 타입은 $lib/types.ts에서 중앙 관리
export type { Journal, UserProfile } from '$lib/types';
