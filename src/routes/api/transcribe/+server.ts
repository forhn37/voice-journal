import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request }) => {
	try {
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
