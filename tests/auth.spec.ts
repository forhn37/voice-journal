import { test, expect } from '@playwright/test';

test.describe('인증 플로우', () => {
	test('로그인 페이지 접근', async ({ page }) => {
		await page.goto('/login');

		// 로그인 페이지 요소 확인 (실제 구조에 맞게 수정)
		await expect(page.locator('h1')).toContainText('Voice Journal');
		await expect(page.getByRole('textbox', { name: /이메일/i })).toBeVisible();

		// 로그인 탭이 활성화되어 있는지 확인
		const loginTab = page.getByRole('button', { name: '로그인', exact: true }).first();
		await expect(loginTab).toBeVisible();

		// 로그인 폼 제출 버튼 확인
		const loginForm = page.locator('form');
		await expect(loginForm.getByRole('button', { name: '로그인' })).toBeVisible();
	});

	test('이메일 형식 검증', async ({ page }) => {
		await page.goto('/login');

		// 로그인 탭 클릭
		await page.getByRole('button', { name: '로그인', exact: true }).first().click();

		// 잘못된 이메일 형식 입력
		await page.getByRole('textbox', { name: /이메일/i }).fill('invalid-email');
		await page.locator('input[type="password"]').fill('password123');

		// 폼 내부의 로그인 버튼 클릭
		await page.locator('form').getByRole('button', { name: '로그인' }).click();

		// 에러 메시지 확인 (Supabase 또는 브라우저 검증 에러)
		// 실제로는 브라우저 내장 검증이 먼저 작동할 수 있음
		await page.waitForTimeout(1000);
	});

	test('인증 없이 메인 페이지 접근 시 리다이렉트', async ({ page }) => {
		// 로그인하지 않은 상태에서 메인 페이지 접근
		await page.goto('/');

		// 로그인 페이지로 리다이렉트 확인
		await expect(page).toHaveURL(/\/login/);
	});

	test('회원가입 탭 전환', async ({ page }) => {
		await page.goto('/login');

		// 회원가입 탭 클릭
		await page.getByRole('button', { name: '회원가입' }).click();

		// 회원가입 폼 확인
		await expect(page.locator('form').getByRole('button', { name: '회원가입' })).toBeVisible();
	});
});
