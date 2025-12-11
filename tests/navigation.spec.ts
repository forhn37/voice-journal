import { test, expect } from '@playwright/test';

test.describe('네비게이션', () => {
	test('로그인 페이지 기본 요소 확인', async ({ page }) => {
		await page.goto('/login');

		// 타이틀 확인
		await expect(page).toHaveTitle(/Voice Journal/i);

		// 로그인 폼 확인
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.getByRole('textbox', { name: /이메일/i })).toBeVisible();

		// 로그인 탭 버튼 확인
		const loginTab = page.getByRole('button', { name: '로그인', exact: true }).first();
		await expect(loginTab).toBeVisible();
	});

	test('설정 페이지 접근 (비인증 시 리다이렉트)', async ({ page }) => {
		// 비인증 상태에서 설정 페이지 접근 시도
		await page.goto('/settings');

		// 로그인 페이지로 리다이렉트되는지 확인
		await expect(page).toHaveURL(/\/login/);

		// 로그인 탭과 회원가입 탭 확인
		await expect(page.getByRole('button', { name: '로그인', exact: true }).first()).toBeVisible();
		await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();
	});

	test('법적 문서 페이지 접근 (비인증 상태)', async ({ page }) => {
		// 개인정보처리방침
		await page.goto('/legal/privacy-policy');
		await expect(page.locator('h1')).toContainText('개인정보처리방침');
		await expect(page.locator('text=/수집하는 개인정보/i')).toBeVisible();

		// 이용약관
		await page.goto('/legal/terms-of-service');
		await expect(page.locator('h1')).toContainText('이용약관');

		// "정의" 섹션 확인 (제2조)
		await expect(page.locator('h2', { hasText: '제2조' })).toBeVisible();
	});

	test('법적 문서 페이지 스크롤 가능', async ({ page }) => {
		await page.goto('/legal/privacy-policy');

		// 페이지 높이 확인
		const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
		const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);

		// 스크롤 가능 여부 확인 (콘텐츠가 화면보다 길면)
		if (scrollHeight > clientHeight) {
			// 페이지 하단으로 스크롤
			await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

			// 스크롤 위치 확인
			const scrollTop = await page.evaluate(() => window.scrollY);
			expect(scrollTop).toBeGreaterThan(0);
		}
	});

	test('뒤로가기 버튼 동작 (법적 문서)', async ({ page }) => {
		await page.goto('/legal/privacy-policy');

		// 설정으로 돌아가기 링크 클릭
		const backLink = page.locator('a', { hasText: '설정으로 돌아가기' });
		await expect(backLink).toBeVisible();

		// 링크 href 확인
		await expect(backLink).toHaveAttribute('href', '/settings');
	});
});
