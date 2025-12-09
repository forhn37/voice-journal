// 오디오 녹음 유틸리티

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

export interface RecordingResult {
	blob: Blob;
	duration: number;
}

// 녹음 시작
export async function startRecording(): Promise<void> {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

	// 지원되는 MIME 타입 확인
	const mimeType = MediaRecorder.isTypeSupported('audio/webm')
		? 'audio/webm'
		: 'audio/mp4';

	mediaRecorder = new MediaRecorder(stream, { mimeType });
	audioChunks = [];

	mediaRecorder.ondataavailable = (event) => {
		if (event.data.size > 0) {
			audioChunks.push(event.data);
		}
	};

	mediaRecorder.start();
}

// 녹음 정지 및 결과 반환
export function stopRecording(): Promise<RecordingResult> {
	return new Promise((resolve, reject) => {
		if (!mediaRecorder) {
			reject(new Error('녹음이 시작되지 않았습니다'));
			return;
		}

		const startTime = Date.now() - (mediaRecorder.stream.getAudioTracks()[0].getSettings().sampleRate || 0);

		mediaRecorder.onstop = () => {
			const blob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });

			// 스트림 정리
			mediaRecorder?.stream.getTracks().forEach((track) => track.stop());

			// duration 계산 (대략적)
			const duration = Math.round((Date.now() - startTime) / 1000);

			resolve({ blob, duration });
		};

		mediaRecorder.onerror = () => {
			reject(new Error('녹음 중 오류가 발생했습니다'));
		};

		mediaRecorder.stop();
	});
}

// 녹음 취소
export function cancelRecording(): void {
	if (mediaRecorder && mediaRecorder.state !== 'inactive') {
		mediaRecorder.stop();
		mediaRecorder.stream.getTracks().forEach((track) => track.stop());
	}
	audioChunks = [];
	mediaRecorder = null;
}

// 마이크 권한 확인
export async function checkMicrophonePermission(): Promise<PermissionState> {
	try {
		const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
		return result.state;
	} catch {
		// permissions API를 지원하지 않는 브라우저
		return 'prompt';
	}
}

// 오디오 길이 검증 (3초 ~ 5분)
export function validateDuration(seconds: number): { valid: boolean; message?: string } {
	if (seconds < 3) {
		return { valid: false, message: '3초 이상 녹음해주세요' };
	}
	if (seconds > 300) {
		return { valid: false, message: '5분 이내로 녹음해주세요' };
	}
	return { valid: true };
}
