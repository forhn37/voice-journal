import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';

// 스트릭 계산 및 캐시 업데이트 함수
async function updateStreakCache(userId: string): Promise<void> {
	try {
		// 일기가 있는 날짜들을 조회 (최근 순)
		const { data: journals } = await supabaseAdmin
			.from('journals')
			.select('created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (!journals || journals.length === 0) {
			return;
		}

		// 날짜별로 그룹화 (중복 제거)
		const journalDates = new Set<string>();
		for (const journal of journals) {
			const date = new Date(journal.created_at);
			const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
			journalDates.add(dateStr);
		}

		// 오늘 날짜
		const today = new Date();
		const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

		// 어제 날짜
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

		// 스트릭 계산
		let streak = 0;
		let checkDate = new Date(today);

		// 오늘 일기가 없으면 어제부터 체크
		if (!journalDates.has(todayStr)) {
			if (!journalDates.has(yesterdayStr)) {
				streak = 0;
			} else {
				checkDate = yesterday;
			}
		}

		if (journalDates.has(todayStr) || journalDates.has(yesterdayStr)) {
			// 연속 일수 계산
			while (true) {
				const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

				if (journalDates.has(dateStr)) {
					streak++;
					checkDate.setDate(checkDate.getDate() - 1);
				} else {
					break;
				}
			}
		}

		// 마지막 일기 작성 날짜 (가장 최근)
		const lastJournalDate = Array.from(journalDates)[0]; // 이미 최근순 정렬됨

		// users 테이블 업데이트
		await supabaseAdmin.from('users').update({
			streak_count: streak,
			last_journal_date: lastJournalDate
		}).eq('id', userId);

	} catch (error) {
		console.error('스트릭 캐시 업데이트 오류:', error);
		// 스트릭 업데이트 실패해도 일기 저장은 성공으로 처리
	}
}

// 일기 저장
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

		const {
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

		// 사용량 체크는 transcribe API에서 이미 처리됨 (API 호출 시점에 카운트 증가)

		const { data, error } = await supabaseAdmin
			.from('journals')
			.insert({
				user_id: userId,
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

		// 스트릭 캐시 업데이트
		await updateStreakCache(userId);

		// 사용량 카운트는 transcribe API에서 이미 증가됨

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

// 일기 삭제
export const DELETE: RequestHandler = async ({ url, locals }) => {
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
		const journalId = url.searchParams.get('id');

		if (!journalId) {
			return json(
				{ success: false, error: 'INVALID_INPUT', message: '일기 ID가 필요해요' },
				{ status: 400 }
			);
		}

		// 본인 일기인지 확인 후 삭제
		const { error } = await supabaseAdmin
			.from('journals')
			.delete()
			.eq('id', journalId)
			.eq('user_id', userId);

		if (error) {
			console.error('일기 삭제 오류:', error);
			return json(
				{ success: false, error: 'DB_ERROR', message: '삭제에 실패했어요' },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: '일기가 삭제되었어요'
		});
	} catch (error) {
		console.error('일기 삭제 오류:', error);
		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: '잠시 문제가 생겼어요' },
			{ status: 500 }
		);
	}
};

// 일기 조회 (목록 또는 단일)
export const GET: RequestHandler = async ({ url, locals }) => {
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
		const journalId = url.searchParams.get('id');

		// 단일 일기 조회
		if (journalId) {
			const { data, error } = await supabaseAdmin
				.from('journals')
				.select('*')
				.eq('id', journalId)
				.eq('user_id', userId) // 본인 일기만 조회
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

		// 일기 목록 조회 (본인 것만)
		const limit = parseInt(url.searchParams.get('limit') || '30');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		const { data, error } = await supabaseAdmin
			.from('journals')
			.select('*')
			.eq('user_id', userId) // 본인 일기만 조회
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

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
