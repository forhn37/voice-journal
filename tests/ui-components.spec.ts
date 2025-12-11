import { test, expect } from '@playwright/test';

test.describe('UI 컴포넌트', () => {
	test('로그인 페이지 탭 전환', async ({ page }) => {
		await page.goto('/login');

		// 로그인 탭이 기본으로 활성화
		const loginTab = page.getByRole('button', { name: '로그인', exact: true }).first();
		await expect(loginTab).toBeVisible();

		// 회원가입 탭으로 전환
		const signupTab = page.getByRole('button', { name: '회원가입' });
		await signupTab.click();

		// 비밀번호 확인 필드가 보일 때까지 대기 (회원가입 모드에서만 표시됨)
		await expect(page.locator('#passwordConfirm')).toBeVisible({ timeout: 10000 });

		// 버튼 텍스트 확인
		const submitButton = page.locator('form button[type="submit"]');
		await expect(submitButton).toContainText('회원가입');

		// 다시 로그인 탭으로 전환
		await loginTab.click();

		// 비밀번호 확인 필드가 사라질 때까지 대기 (로그인 모드에서는 숨겨짐)
		await expect(page.locator('#passwordConfirm')).not.toBeVisible({ timeout: 10000 });

		// 버튼 텍스트 확인
		await expect(submitButton).toContainText('로그인');
	});

	test('이메일 입력 필드 검증', async ({ page }) => {
		await page.goto('/login');

		const emailInput = page.getByRole('textbox', { name: /이메일/i });

		// Placeholder 확인
		await expect(emailInput).toHaveAttribute('placeholder', /email/i);

		// Type 확인
		await expect(emailInput).toHaveAttribute('type', 'email');

		// 값 입력
		await emailInput.fill('test@example.com');
		await expect(emailInput).toHaveValue('test@example.com');
	});

	test('비밀번호 입력 필드 검증', async ({ page }) => {
		await page.goto('/login');

		const passwordInput = page.locator('input[type="password"]').first();

		// Type 확인
		await expect(passwordInput).toHaveAttribute('type', 'password');

		// Placeholder 확인
		await expect(passwordInput).toHaveAttribute('placeholder');

		// 값 입력
		await passwordInput.fill('myPassword123');
		await expect(passwordInput).toHaveValue('myPassword123');
	});

	test('Google 로그인 버튼 (준비 중 상태)', async ({ page }) => {
		await page.goto('/login');

		// Google 로그인 버튼 확인
		const googleButton = page.getByRole('button', { name: /Google 로그인/i });
		await expect(googleButton).toBeVisible();

		// 비활성화 상태 확인
		await expect(googleButton).toBeDisabled();

		// "준비 중" 텍스트 확인
		await expect(googleButton).toContainText(/준비 중/i);
	});
});

test.describe('법적 문서 페이지', () => {
	test('개인정보처리방침 - 모든 섹션 표시', async ({ page }) => {
		await page.goto('/legal/privacy-policy');

		// h1 제목 확인
		await expect(page.locator('h1')).toContainText('개인정보처리방침');

		// 페이지 컨텐츠가 로드되었는지 확인
		await expect(page.locator('body')).toBeVisible();

		// 컨텐츠가 충분히 긴지 확인 (개인정보처리방침은 긴 문서)
		const textContent = await page.textContent('body');
		expect(textContent).toBeTruthy();
		expect(textContent!.length).toBeGreaterThan(100);

		// 일부 주요 키워드 확인
		const hasPrivacyContent =
			textContent!.includes('개인정보') ||
			textContent!.includes('수집') ||
			textContent!.includes('보호');
		expect(hasPrivacyContent).toBeTruthy();
	});

	test('이용약관 - 모든 섹션 표시', async ({ page }) => {
		await page.goto('/legal/terms-of-service');

		// 주요 섹션 제목 확인
		const sections = [
			'제1조',
			'제2조',
			'제3조',
			'제4조',
			'제5조',
			'제6조',
			'제7조',
			'제8조',
			'제9조',
			'제10조',
			'제11조'
		];

		for (const section of sections) {
			await expect(page.locator('h2', { hasText: section })).toBeVisible();
		}
	});

	test('설정으로 돌아가기 링크', async ({ page }) => {
		// 개인정보처리방침
		await page.goto('/legal/privacy-policy');

		const backLink = page.getByRole('link', { name: /설정으로 돌아가기/i });
		await expect(backLink).toBeVisible();
		await expect(backLink).toHaveAttribute('href', '/settings');

		// 이용약관
		await page.goto('/legal/terms-of-service');

		const backLink2 = page.getByRole('link', { name: /설정으로 돌아가기/i });
		await expect(backLink2).toBeVisible();
		await expect(backLink2).toHaveAttribute('href', '/settings');
	});

	test('최종 업데이트 날짜 표시', async ({ page }) => {
		await page.goto('/legal/privacy-policy');

		// 최종 업데이트 날짜 확인
		await expect(page.locator('text=/최종 업데이트|마지막 업데이트/i').first()).toBeVisible();
		await expect(page.locator('text=/2025년 12월 11일/i').first()).toBeVisible();
	});
});

test.describe('페이지 메타데이터', () => {
	test('로그인 페이지 타이틀', async ({ page }) => {
		await page.goto('/login');
		await expect(page).toHaveTitle(/Voice Journal/i);
	});

	test('개인정보처리방침 페이지 타이틀', async ({ page }) => {
		await page.goto('/legal/privacy-policy');
		// h1이 로드될 때까지 대기 (페이지가 완전히 렌더링됨을 보장)
		await expect(page.locator('h1')).toBeVisible();
		await expect(page).toHaveTitle(/개인정보처리방침/i);
	});

	test('이용약관 페이지 타이틀', async ({ page }) => {
		await page.goto('/legal/terms-of-service');
		// h1이 로드될 때까지 대기 (페이지가 완전히 렌더링됨을 보장)
		await expect(page.locator('h1')).toBeVisible();
		await expect(page).toHaveTitle(/이용약관/i);
	});
});
