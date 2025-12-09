import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { buildImagePrompt } from '$lib/prompts/image';
import { supabaseAdmin } from '$lib/server/supabase';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { scene, emotion } = await request.json();

		if (!scene || typeof scene !== 'string') {
			return json(
				{ success: false, error: 'INVALID_INPUT', message: '장면 설명이 없어요' },
				{ status: 400 }
			);
		}

		const prompt = buildImagePrompt(scene, emotion || 'neutral');

		// DALL-E 3 호출
		const response = await openai.images.generate({
			model: 'dall-e-3',
			prompt,
			n: 1,
			size: '1024x1024',
			quality: 'standard'
		});

		if (!response.data || response.data.length === 0) {
			throw new Error('이미지 생성 결과가 없습니다');
		}

		const tempImageUrl = response.data[0]?.url;

		if (!tempImageUrl) {
			throw new Error('이미지 URL이 없습니다');
		}

		// DALL-E 이미지를 Supabase Storage에 업로드
		const imageResponse = await fetch(tempImageUrl);
		const imageBlob = await imageResponse.blob();
		const imageBuffer = await imageBlob.arrayBuffer();

		const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
		const filePath = `journals/${fileName}`;

		const { error: uploadError } = await supabaseAdmin.storage
			.from('journal-images')
			.upload(filePath, imageBuffer, {
				contentType: 'image/png',
				cacheControl: '31536000' // 1년 캐시
			});

		if (uploadError) {
			console.error('Storage 업로드 오류:', uploadError);
			throw new Error('이미지 저장에 실패했습니다');
		}

		// 영구 URL 생성
		const imageUrl = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/journal-images/${filePath}`;

		return json({
			success: true,
			imageUrl,
			prompt
		});
	} catch (error) {
		console.error('DALL-E 오류:', error);

		if (error instanceof OpenAI.APIError) {
			return json(
				{ success: false, error: 'DALLE_ERROR', message: '그림 생성에 문제가 생겼어요' },
				{ status: 502 }
			);
		}

		return json(
			{ success: false, error: 'INTERNAL_ERROR', message: '잠시 문제가 생겼어요' },
			{ status: 500 }
		);
	}
};
