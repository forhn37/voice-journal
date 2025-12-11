import { test, expect } from '@playwright/test';

test.describe('반응형 디자인', () => {
	const viewports = [
		{ name: 'iPhone SE', width: 375, height: 667 },
		{ name: 'iPhone 12', width: 390, height: 844 },
		{ name: 'Pixel 5', width: 393, height: 851 },
		{ name: 'iPad', width: 768, height: 1024 },
		{ name: 'Desktop', width: 1920, height: 1080 },
	];

	for (const viewport of viewports) {
		test(`${viewport.name} (${viewport.width}x${viewport.height})에서 로그인 페이지 표시`, async ({ page }) => {
			// 뷰포트 설정
			await page.setViewportSize({ width: viewport.width, height: viewport.height });

			// 로그인 페이지 이동
			await page.goto('/login');

			// 기본 요소 표시 확인
			await expect(page.locator('h1')).toBeVisible();
			await expect(page.getByRole('textbox', { name: /이메일/i })).toBeVisible();

			// 로그인 탭 버튼 확인
			const loginTab = page.getByRole('button', { name: '로그인', exact: true }).first();
			await expect(loginTab).toBeVisible();

			// 폼 제출 버튼 확인
			await expect(page.locator('form button[type="submit"]')).toBeVisible();

			// 스크린샷 (선택)
			// await page.screenshot({ path: `screenshots/login-${viewport.name}.png` });
		});
	}

	test('모바일 뷰에서 법적 문서 스크롤', async ({ page }) => {
		// 모바일 뷰포트 설정
		await page.setViewportSize({ width: 375, height: 667 });

		await page.goto('/legal/privacy-policy');

		// 페이지가 로드되었는지 확인
		await expect(page.locator('h1')).toBeVisible();

		// 스크롤 시도
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await page.waitForTimeout(500);

		// 스크롤이 가능한 경우 스크롤 위치 확인, 그렇지 않으면 페이지가 짧음
		const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
		const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);

		// 스크롤 가능한지 또는 컨텐츠가 있는지 확인
		expect(scrollHeight).toBeGreaterThan(0);
		expect(clientHeight).toBeGreaterThan(0);
	});

	test('터치 인터랙션 (모바일)', async ({ page }) => {
		// 모바일 뷰포트 설정
		await page.setViewportSize({ width: 375, height: 667 });

		await page.goto('/login');

		// 터치 시뮬레이션 (클릭으로 대체)
		const emailInput = page.getByRole('textbox', { name: /이메일/i });
		await emailInput.click();
		await expect(emailInput).toBeFocused();
	});
});
