import { createClient } from '@supabase/supabase-js';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_PUBLISHABLE_KEY
} from '$env/static/public';

// 클라이언트용 Supabase 인스턴스 (Publishable Key 사용)
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);

// 타입 정의
export type Journal = {
	id: string;
	user_id: string;
	transcript: string;
	summary: string;
	emotion: string;
	emotion_score: number;
	scene: string;
	character_message: string;
	image_url: string;
	audio_duration: number;
	created_at: string;
};

export type UserProfile = {
	id: string;
	nickname: string;
	notification_time: string | null;
	streak_count: number;
	last_journal_date: string | null;
	created_at: string;
};
