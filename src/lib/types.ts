// 공통 타입 정의

// 일기 타입
export type Journal = {
	id: string;
	user_id: string;
	transcript: string;
	summary: string;
	emotion: Emotion;
	emotion_score: number;
	scene: string;
	character_message: string;
	image_url: string;
	audio_duration: number;
	created_at: string;
};

// 일기 목록용 간소화 타입
export type JournalSummary = Pick<
	Journal,
	'id' | 'summary' | 'emotion' | 'image_url' | 'created_at'
>;

// 감정 타입
export type Emotion = 'joy' | 'sadness' | 'anger' | 'fear' | 'anxiety' | 'neutral';

// 유저 프로필 타입
export type UserProfile = {
	id: string;
	nickname: string;
	notification_time: string | null;
	streak_count: number;
	last_journal_date: string | null;
	created_at: string;
};

// 유저 정보 (로컬 상태용)
export type UserInfo = {
	nickname: string;
	notificationTime: string | null;
	onboardingCompleted: boolean;
};

// API 응답 기본 타입
export type ApiResponse<T = unknown> = {
	success: boolean;
	error?: string;
	message?: string;
} & T;

// 사용량 정보 타입
export type UsageInfo = {
	used: number;
	limit: number;
	remaining: number;
	canCreate: boolean;
};

// AI 분석 결과 타입
export type AnalysisResult = {
	scene: string;
	emotion: Emotion;
	emotionScore: number;
	summary: string;
	characterMessage: string;
};

// 감정 통계 타입
export type EmotionDistribution = Record<Emotion, number>;

export type DailyEmotion = {
	date: string;
	emotion: Emotion;
	count: number;
};

export type EmotionStats = {
	totalJournals: number;
	streak: number;
	emotionDistribution: EmotionDistribution;
	dailyEmotions: DailyEmotion[];
};
