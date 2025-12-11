import { test, expect } from '@playwright/test';

test.describe('접근성 (Accessibility)', () => {
	test('로그인 페이지 키보드 네비게이션', async ({ page }) => {
		await page.goto('/login');

		// 이메일 input에 포커스
		const emailInput = page.getByRole('textbox', { name: /이메일/i });
		await emailInput.focus();
		await expect(emailInput).toBeFocused();

		// Tab 키로 비밀번호로 이동
		await page.keyboard.press('Tab');
		const passwordInput = page.locator('input[type="password"]').first();
		await expect(passwordInput).toBeFocused();

		// Tab 키로 로그인 버튼으로 이동
		await page.keyboard.press('Tab');
		// 로그인 폼 제출 버튼이 포커스되어야 함
		const loginButton = page.locator('form button[type="submit"]');
		await expect(loginButton).toBeFocused();
	});

	test('법적 문서 페이지 Heading 구조', async ({ page }) => {
		await page.goto('/legal/privacy-policy');

		// h1 존재 확인
		const h1 = page.locator('h1');
		await expect(h1).toBeVisible();
		await expect(h1).toHaveCount(1);

		// h2 제목들 확인 (섹션 제목)
		const h2List = page.locator('h2');
		const h2Count = await h2List.count();
		expect(h2Count).toBeGreaterThan(0);
	});

	test('버튼 및 링크 접근 가능', async ({ page }) => {
		await page.goto('/login');

		// 로그인 탭 버튼 확인
		const loginTabButton = page.getByRole('button', { name: '로그인', exact: true }).first();
		await expect(loginTabButton).toBeVisible();
		await expect(loginTabButton).toBeEnabled();

		// 회원가입 탭 버튼 확인
		const signupButton = page.getByRole('button', { name: '회원가입' });
		await expect(signupButton).toBeVisible();
		await expect(signupButton).toBeEnabled();

		// 폼 제출 버튼 확인
		const submitButton = page.locator('form button[type="submit"]');
		await expect(submitButton).toBeVisible();
	});

	test('색상 대비 확인 (수동 검증 필요)', async ({ page }) => {
		await page.goto('/login');

		// 배경색과 텍스트 색상 가져오기
		const backgroundColor = await page.evaluate(() => {
			return window.getComputedStyle(document.body).backgroundColor;
		});

		const textColor = await page.evaluate(() => {
			const h1 = document.querySelector('h1');
			return h1 ? window.getComputedStyle(h1).color : 'rgb(0, 0, 0)';
		});

		// 색상 값 출력 (실제 대비 계산은 별도 라이브러리 필요)
		console.log('Background:', backgroundColor);
		console.log('Text:', textColor);

		// 최소한 값이 존재하는지 확인
		expect(backgroundColor).toBeTruthy();
		expect(textColor).toBeTruthy();
	});

	test('포커스 스타일 확인', async ({ page }) => {
		await page.goto('/login');

		const emailInput = page.getByRole('textbox', { name: /이메일/i });
		await emailInput.focus();

		// 포커스 상태에서 outline 또는 border 스타일 확인
		const outlineStyle = await emailInput.evaluate((el) => {
			const styles = window.getComputedStyle(el);
			return {
				outline: styles.outline,
				outlineWidth: styles.outlineWidth,
				borderColor: styles.borderColor,
			};
		});

		// 포커스 스타일이 존재하는지 확인
		const hasFocusStyle =
			outlineStyle.outlineWidth !== '0px' ||
			outlineStyle.borderColor !== 'rgb(0, 0, 0)';

		expect(hasFocusStyle).toBeTruthy();
	});
});
