// 일기 생성 진행 상태를 관리하는 전역 스토어
import type { AnalysisResult } from '$lib/types';

type PageStatus = 'idle' | 'transcribing' | 'analyzing' | 'generating' | 'preview' | 'saving' | 'completed' | 'error';
type ErrorStep = 'transcribing' | 'analyzing' | 'generating' | 'saving' | null;

interface JournalCreationState {
	pageStatus: PageStatus;
	errorStep: ErrorStep;
	errorMessage: string;
	transcript: string;
	audioDuration: number;
	analysisResult: AnalysisResult | null;
	imageUrl: string;
	savedJournalId: string | null;
	lastRecordingBlob: Blob | null;
}

// 초기 상태
const initialState: JournalCreationState = {
	pageStatus: 'idle',
	errorStep: null,
	errorMessage: '',
	transcript: '',
	audioDuration: 0,
	analysisResult: null,
	imageUrl: '',
	savedJournalId: null,
	lastRecordingBlob: null
};

// Svelte 5 runes를 사용한 전역 상태
let state = $state<JournalCreationState>({ ...initialState });

// 상태 관리 함수들
export const journalCreationStore = {
	// 현재 상태 읽기 (getter)
	get status() { return state.pageStatus; },
	get errorStep() { return state.errorStep; },
	get errorMessage() { return state.errorMessage; },
	get transcript() { return state.transcript; },
	get audioDuration() { return state.audioDuration; },
	get analysisResult() { return state.analysisResult; },
	get imageUrl() { return state.imageUrl; },
	get savedJournalId() { return state.savedJournalId; },
	get lastRecordingBlob() { return state.lastRecordingBlob; },
	get isProcessing() {
		return state.pageStatus !== 'idle' &&
		       state.pageStatus !== 'preview' &&
		       state.pageStatus !== 'completed' &&
		       state.pageStatus !== 'error';
	},

	// 상태 업데이트
	setStatus(status: PageStatus) {
		state.pageStatus = status;
	},

	setError(errorStep: ErrorStep, message: string) {
		state.pageStatus = 'error';
		state.errorStep = errorStep;
		state.errorMessage = message;
	},

	setTranscript(transcript: string, duration: number) {
		state.transcript = transcript;
		state.audioDuration = duration;
	},

	setAnalysis(result: AnalysisResult) {
		state.analysisResult = result;
	},

	setImage(url: string) {
		state.imageUrl = url;
	},

	// 미리보기 상태로 전환 (저장 전)
	setPreview() {
		state.pageStatus = 'preview';
	},

	setCompleted(journalId: string) {
		state.pageStatus = 'completed';
		state.savedJournalId = journalId;
		state.errorStep = null;
		state.errorMessage = '';
	},

	setRecordingBlob(blob: Blob | null) {
		state.lastRecordingBlob = blob;
	},

	// 전체 상태 초기화
	reset() {
		state = { ...initialState };
	},

	// 에러 상태에서 재시도를 위한 부분 초기화
	clearError() {
		state.errorMessage = '';
	}
};
