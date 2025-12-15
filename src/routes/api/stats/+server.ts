import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabase';
import type { EmotionDistribution, DailyEmotion, Emotion } from '$lib/types';

// 스트릭 계산 함수 (usage API와 동일)
async function calculateStreak(userId: string): Promise<number> {
	const { data: journals } = await supabaseAdmin
		.from('journals')
		.select('created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (!journals || journals.length === 0) {
		return 0;
	}

	// 날짜별로 그룹화
	const journalDates = new Set<string>();
	for (const journal of journals) {
		const date = new Date(journal.created_at);
		const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
		journalDates.add(dateStr);
	}

	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

	let streak = 0;
	let checkDate = new Date(today);

	if (!journalDates.has(todayStr)) {
		if (!journalDates.has(yesterdayStr)) {
			return 0;
		}
		checkDate = yesterday;
	}

	while (true) {
		const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

		if (journalDates.has(dateStr)) {
			streak++;
			checkDate.setDate(checkDate.getDate() - 1);
		} else {
			break;
		}
	}

	return streak;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		// 세션 확인
		const { user } = await locals.safeGetSession();
		if (!user) {
			return json(
				{ success: false, error: 'UNAUTHORIZED', message: '로그인이 필요해요' },
				{ status: 401 }
			);
		}

		const userId = user.id;
		const period = url.searchParams.get('period') || 'week'; // week | month

		// 기간 계산
		const now = new Date();
		const startDate = new Date();

		if (period === 'week') {
			startDate.setDate(now.getDate() - 7);
		} else {
			startDate.setDate(now.getDate() - 30);
		}

		// 해당 기간의 일기 조회
		const { data: journals, error } = await supabaseAdmin
			.from('journals')
			.select('emotion, created_at')
			.eq('user_id', userId)
			.gte('created_at', startDate.toISOString())
			.order('created_at', { ascending: true });

		if (error) {
			console.error('통계 조회 오류:', error);
			throw error;
		}

		// 감정 분포 계산
		const emotionDistribution: EmotionDistribution = {
			joy: 0,
			sadness: 0,
			anger: 0,
			fear: 0,
			anxiety: 0,
			neutral: 0
		};

		// 날짜별 감정 데이터 (차트용)
		const dailyEmotionsMap = new Map<string, Map<Emotion, number>>();

		for (const journal of journals || []) {
			const emotion = journal.emotion as Emotion;
			emotionDistribution[emotion]++;

			// 날짜별 감정 카운트
			const date = new Date(journal.created_at);
			const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

			if (!dailyEmotionsMap.has(dateStr)) {
				dailyEmotionsMap.set(dateStr, new Map());
			}

			const emotionMap = dailyEmotionsMap.get(dateStr)!;
			emotionMap.set(emotion, (emotionMap.get(emotion) || 0) + 1);
		}

		// 날짜별 감정 배열로 변환 (가장 많은 감정만)
		const dailyEmotions: DailyEmotion[] = [];
		for (const [date, emotionMap] of dailyEmotionsMap.entries()) {
			let maxEmotion: Emotion = 'neutral';
			let maxCount = 0;

			for (const [emotion, count] of emotionMap.entries()) {
				if (count > maxCount) {
					maxEmotion = emotion;
					maxCount = count;
				}
			}

			dailyEmotions.push({
				date,
				emotion: maxEmotion,
				count: maxCount
			});
		}

		// 스트릭 계산
		const streak = await calculateStreak(userId);

		return json({
			success: true,
			stats: {
				totalJournals: journals?.length || 0,
				streak,
				emotionDistribution,
				dailyEmotions
			}
		});
	} catch (error) {
		console.error('통계 API 오류:', error);
		return json(
			{
				success: false,
				error: 'STATS_ERROR',
				message: '통계를 불러올 수 없어요'
			},
			{ status: 500 }
		);
	}
};
