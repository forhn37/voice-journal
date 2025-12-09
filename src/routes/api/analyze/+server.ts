import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { ANALYZE_SYSTEM_PROMPT, ANALYZE_USER_PROMPT } from '$lib/prompts/analyze';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { transcript } = await request.json();

		if (!transcript || typeof transcript !== 'string') {
			return json(
				{ success: false, error: 'INVALID_INPUT', message: '텍스트가 없어요' },
				{ status: 400 }
			);
		}

		// GPT-4o-mini 호출
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: ANALYZE_SYSTEM_PROMPT },
				{ role: 'user', content: ANALYZE_USER_PROMPT(transcript) }
			],
			temperature: 0.7,
			response_format: { type: 'json_object' }
		});

		const content = completion.choices[0]?.message?.content;

		if (!content) {
			throw new Error('GPT 응답이 비어있습니다');
		}

		const result = JSON.parse(content);

		return json({
			success: true,
			scene: result.scene,
			emotion: result.emotion,
			emotionScore: result.emotionScore,
			summary: result.summary,
			characterMessage: result.characterMessage
		});
	} catch (error) {
		console.error('GPT 분석 오류:', error);

		if (error instanceof OpenAI.APIError) {
			return json(
				{ success: false, error: 'GPT_ERROR', message: 'AI 분석에 문제가 생겼어요' },
				{ status: 502 }
			);
		}

		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: '잠시 문제가 생겼어요' },
			{ status: 500 }
		);
	}
};
