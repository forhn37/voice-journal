import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabase';
import { DAILY_LIMIT } from '$lib/constants';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// 세션에서 user_id 가져오기
		const { user } = await locals.safeGetSession();
		if (!user) {
			return json(
				{ success: false, error: 'UNAUTHORIZED', message: '로그인이 필요해요' },
				{ status: 401 }
			);
		}

		const userId = user.id;

		// 사용량 체크 및 증가 (API 호출 전에!)
		const today = new Date();
		const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

		const { data: userData } = await supabaseAdmin
			.from('users')
			.select('daily_usage_count, daily_usage_date')
			.eq('id', userId)
			.single();

		// 날짜가 바뀌면 카운트 리셋
		let todayCount = 0;
		if (userData && userData.daily_usage_date === todayStr) {
			todayCount = userData.daily_usage_count || 0;
		}

		// 한도 체크
		if (todayCount >= DAILY_LIMIT) {
			return json(
				{
					success: false,
					error: 'DAILY_LIMIT_EXCEEDED',
					message: '오늘은 여기까지! 내일 다시 이야기 들려줘 🐶'
				},
				{ status: 429 }
			);
		}

		// 사용량 카운트 증가 (API 호출 전에 먼저!)
		const newCount = todayCount + 1;
		await supabaseAdmin.from('users').update({
			daily_usage_count: newCount,
			daily_usage_date: todayStr
		}).eq('id', userId);

		const formData = await request.formData();
		const audioFile = formData.get('audio') as File;

		if (!audioFile) {
			return json(
				{ success: false, error: 'INVALID_AUDIO', message: '오디오 파일이 없어요' },
				{ status: 400 }
			);
		}

		// 파일 크기 검증 (25MB 제한 - Whisper API 제한)
		if (audioFile.size > 25 * 1024 * 1024) {
			return json(
				{ success: false, error: 'FILE_TOO_LARGE', message: '파일이 너무 커요 (25MB 이하)' },
				{ status: 400 }
			);
		}

		// Whisper API 호출
		const transcription = await openai.audio.transcriptions.create({
			file: audioFile,
			model: 'whisper-1',
			language: 'ko',
			response_format: 'json'
		});

		return json({
			success: true,
			transcript: transcription.text
		});
	} catch (error) {
		console.error('Whisper API 오류:', error);

		if (error instanceof OpenAI.APIError) {
			return json(
				{ success: false, error: 'WHISPER_ERROR', message: '음성 인식에 문제가 생겼어요' },
				{ status: 502 }
			);
		}

		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: '잠시 문제가 생겼어요' },
			{ status: 500 }
		);
	}
};
