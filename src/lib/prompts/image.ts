// DALL-E 이미지 프롬프트 빌더

type Emotion = 'joy' | 'sadness' | 'anger' | 'fear' | 'anxiety' | 'neutral';

const MOOD_STYLES: Record<Emotion, string> = {
	joy: 'bright cheerful colors, warm golden sunlight streaming through windows, happy uplifting atmosphere, vibrant spring colors, clear blue sky',
	sadness: 'soft blue and grey tones, gentle melancholy, rain falling softly, cozy indoor atmosphere, warm light contrasting cool exterior, comforting solitude',
	anger: 'dramatic warm orange and red tones, intense sunset or fiery sky, expressive clouds, dynamic energy, bold contrasts',
	fear: 'deep purple and dark blue twilight, mysterious nighttime, gentle moonlight, comforting warm indoor lights, stars in sky',
	anxiety: 'muted pastel colors, soft diffused lighting, worried but hopeful mood, gentle shadows, foggy or hazy atmosphere',
	neutral: 'balanced warm natural colors, peaceful calm atmosphere, relaxed mood, soft daylight, gentle harmony'
};

export function buildImagePrompt(scene: string, emotion: string): string {
	const mood = MOOD_STYLES[emotion as Emotion] || MOOD_STYLES.neutral;

	return `
Studio Ghibli style illustration, like a movie still from a Hayao Miyazaki film. Scenic landscape or cozy interior scene with NO people, NO characters, NO animals.

Scene Description: ${scene}

Mood & Atmosphere: ${mood}

Art Style: Hand-painted anime aesthetic, masterful use of light and shadow, rich environmental details, dreamy nostalgic atmosphere, vibrant yet soothing color palette, cinematic composition, depth and perspective.

Technical: High quality, detailed background art, painterly textures, soft gradients, atmospheric lighting effects.

IMPORTANT: Absolutely NO text, NO words, NO people, NO characters, NO animals in the image. Focus purely on environment and atmosphere.
	`.trim();
}
