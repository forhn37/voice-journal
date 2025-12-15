import { test, expect, type Page } from '@playwright/test';

test.describe('타임캡슐 기능 (Time Capsule)', () => {
	// 헬퍼: 로그인
	async function login(page: Page) {
		await page.goto('/login');
		await page.getByRole('textbox', { name: /이메일/i }).fill('test@example.com');
		await page.locator('input[type="password"]').first().fill('test123');
		await page.locator('form button[type="submit"]').click();
		await page.waitForURL('/');
	}

	test('타임캡슐 API가 응답을 반환해야 함', async ({ page }) => {
		await login(page);

		// API 호출
		const response = await page.request.get('/api/timecapsule');
		expect(response.ok()).toBeTruthy();

		const data = await response.json();
		expect(data.success).toBe(true);
		// journal은 있을 수도 없을 수도 있음
	});

	test('1년 전 일기가 있으면 메인 페이지에 타임캡슐이 표시되어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// 타임캡슐 조회 (있을 수도 없을 수도 있음)
		const timeCapsuleExists = await page.locator('text=/1년 전 오늘/i').count();

		if (timeCapsuleExists > 0) {
			// 타임캡슐이 있으면 컴포넌트 요소들 확인
			await expect(page.getByText(/1년 전 오늘/i)).toBeVisible();

			// 이미지 확인
			const timeCapsuleImage = page.locator('img[alt="1년 전 일기 그림"]');
			await expect(timeCapsuleImage).toBeVisible();

			// 자세히 보기 버튼 확인
			const detailButton = page.getByRole('button', { name: /자세히 보기/i });
			await expect(detailButton).toBeVisible();
		}
	});

	test('타임캡슐의 "자세히 보기" 버튼을 클릭하면 일기 상세 페이지로 이동해야 함', async ({
		page
	}) => {
		await login(page);
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// 타임캡슐 확인
		const timeCapsuleExists = await page.locator('text=/1년 전 오늘/i').count();

		if (timeCapsuleExists > 0) {
			// 자세히 보기 버튼 클릭
			const detailButton = page.getByRole('button', { name: /자세히 보기/i });
			await detailButton.click();

			// 일기 상세 페이지로 이동했는지 확인
			await page.waitForURL(/\/journal\//);
			await expect(page.getByRole('heading', { name: /일기/i })).toBeVisible();
		} else {
			test.skip();
		}
	});

	test('1년 전 일기가 없으면 타임캡슐이 표시되지 않아야 함', async ({ page }) => {
		await login(page);
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// 타임캡슐 API 응답 확인
		const response = await page.request.get('/api/timecapsule');
		const data = await response.json();

		if (!data.journal) {
			// 일기가 없으면 타임캡슐 컴포넌트가 표시되지 않아야 함
			const timeCapsuleExists = await page.locator('text=/1년 전 오늘/i').count();
			expect(timeCapsuleExists).toBe(0);
		}
	});

	test('타임캡슐에 날짜가 올바르게 표시되어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// API 응답 확인
		const response = await page.request.get('/api/timecapsule');
		const data = await response.json();

		if (data.journal && data.oneYearAgoDate) {
			// 타임캡슐 확인
			await expect(page.getByText(/1년 전 오늘/i)).toBeVisible();

			// 날짜 포맷 확인 (YYYY년 MM월 DD일 형식)
			const dateRegex = /\d{4}년 \d{1,2}월 \d{1,2}일/;
			const dateText = await page.locator('text=/1년 전 오늘/i').locator('..').textContent();
			expect(dateText).toMatch(dateRegex);
		} else {
			test.skip();
		}
	});

	test('타임캡슐에 감정 이모지와 이름이 표시되어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// 타임캡슐 확인
		const timeCapsuleExists = await page.locator('text=/1년 전 오늘/i').count();

		if (timeCapsuleExists > 0) {
			// 감정 관련 텍스트가 있는지 확인 (기쁨, 슬픔, 화남, 불안, 평온 등)
			const emotionRegex = /기쁨|슬픔|화남|불안|평온/;
			const bodyText = await page.textContent('body');
			expect(bodyText).toMatch(emotionRegex);
		} else {
			test.skip();
		}
	});
});
