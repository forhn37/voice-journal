import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: import.meta.env.PUBLIC_SENTRY_DSN,
	tracesSampleRate: 1.0,

	// 이 프로젝트는 세션 리플레이를 활용합니다
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,

	integrations: [replayIntegration()]
});

// 에러 핸들링
export const handleError = handleErrorWithSentry();
