import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: import.meta.env.PUBLIC_SENTRY_DSN,
	tracesSampleRate: 1.0
});

// 핸들
export const handle = sentryHandle();

// 에러 핸들링
export const handleError = handleErrorWithSentry();
