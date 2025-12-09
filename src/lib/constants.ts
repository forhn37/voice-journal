// 공통 상수 정의

import type { Emotion } from './types';

// 일일 사용 제한
export const DAILY_LIMIT = 3;

// 녹음 제한 (초)
export const MIN_RECORDING_DURATION = 3;
export const MAX_RECORDING_DURATION = 300; // 5분

// 감정 이모지 매핑
export const EMOTION_EMOJI: Record<Emotion, string> = {
	joy: '😊',
	sadness: '😢',
	anger: '😤',
	fear: '😨',
	anxiety: '😰',
	neutral: '😌'
};

// 감정 한글 매핑
export const EMOTION_KOREAN: Record<Emotion, string> = {
	joy: '기쁨',
	sadness: '슬픔',
	anger: '화남',
	fear: '두려움',
	anxiety: '불안',
	neutral: '평온'
};

// 이미지 설정
export const IMAGE_SIZE = '1024x1024' as const;

// API 비용 (참고용)
export const API_COSTS = {
	whisper_per_minute: 0.006,
	gpt4o_mini_per_request: 0.005,
	dalle3_1024: 0.08
} as const;
