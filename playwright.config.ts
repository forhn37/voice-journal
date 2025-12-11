import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	// 테스트 파일 위치
	testDir: './tests',

	// 각 테스트 타임아웃 (30초)
	timeout: 30000,

	// 병렬 실행 설정
	fullyParallel: true,

	// CI 환경에서 재시도
	retries: process.env.CI ? 2 : 0,

	// 병렬 워커 수
	workers: process.env.CI ? 1 : undefined,

	// 리포터 설정
	reporter: [
		['html'],
		['list']
	],

	// 모든 프로젝트에 공통 설정
	use: {
		// 베이스 URL (로컬 개발 서버)
		baseURL: 'http://localhost:5173',

		// 트레이스 설정 (실패 시만)
		trace: 'on-first-retry',

		// 스크린샷 설정 (실패 시만)
		screenshot: 'only-on-failure',

		// 비디오 설정 (실패 시만)
		video: 'retain-on-failure',
	},

	// 테스트 시작 전 개발 서버 실행
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},

	// 테스트할 브라우저 설정
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},

		// 모바일 테스트
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] },
		},
	],
});
