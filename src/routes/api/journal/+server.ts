import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import { DAILY_LIMIT } from '$lib/constants';

// 일기 저장
export const POST: RequestHandler = async ({ request }) => {
	try {
		const {
			userId,
			transcript,
			summary,
			emotion,
			emotionScore,
			scene,
			characterMessage,
			imageUrl,
			audioDuration
		} = await request.json();

		// 필수 필드 검증
		if (!transcript || !summary || !emotion || !imageUrl) {
			return json(
				{ success: false, error: 'INVALID_INPUT', message: '필수 정보가 없어요' },
				{ status: 400 }
			);
		}

		// 사용량 체크
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const { count, error: countError } = await supabaseAdmin
			.from('journals')
			.select('id', { count: 'exact', head: true })
			.gte('created_at', today.toISOString());

		if (countError) {
			console.error('사용량 체크 오류:', countError);
		}

		const todayCount = count || 0;

		if (todayCount >= DAILY_LIMIT) {
			return json(
				{
					success: false,
					error: 'DAILY_LIMIT_EXCEEDED',
					message: `오늘은 여기까지! 내일 다시 이야기 들려줘 🐶`
				},
				{ status: 429 }
			);
		}

		const { data, error } = await supabaseAdmin
			.from('journals')
			.insert({
				user_id: userId || null,
				transcript,
				summary,
				emotion,
				emotion_score: emotionScore || 0,
				scene,
				character_message: characterMessage,
				image_url: imageUrl,
				audio_duration: audioDuration || 0
			})
			.select()
			.single();

		if (error) {
			console.error('일기 저장 오류:', error);
			return json(
				{ success: false, error: 'DB_ERROR', message: '저장에 실패했어요' },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			journal: data
		});
	} catch (error) {
		console.error('일기 저장 오류:', error);
		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: '잠시 문제가 생겼어요' },
			{ status: 500 }
		);
	}
};

// 일기 조회 (목록 또는 단일)
export const GET: RequestHandler = async ({ url }) => {
	try {
		const journalId = url.searchParams.get('id');

		// 단일 일기 조회
		if (journalId) {
			const { data, error } = await supabaseAdmin
				.from('journals')
				.select('*')
				.eq('id', journalId)
				.single();

			if (error) {
				console.error('일기 조회 오류:', error);
				return json(
					{ success: false, error: 'DB_ERROR', message: '일기를 찾을 수 없어요' },
					{ status: 404 }
				);
			}

			return json({
				success: true,
				journal: data
			});
		}

		// 일기 목록 조회
		const userId = url.searchParams.get('userId');
		const limit = parseInt(url.searchParams.get('limit') || '30');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		let query = supabaseAdmin
			.from('journals')
			.select('*')
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (userId) {
			query = query.eq('user_id', userId);
		}

		const { data, error } = await query;

		if (error) {
			console.error('일기 조회 오류:', error);
			return json(
				{ success: false, error: 'DB_ERROR', message: '조회에 실패했어요' },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			journals: data
		});
	} catch (error) {
		console.error('일기 조회 오류:', error);
		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: '잠시 문제가 생겼어요' },
			{ status: 500 }
		);
	}
};
