import { test, expect, type Page } from '@playwright/test';

test.describe('감정 통계 페이지 (Stats Page)', () => {
	// 헬퍼: 로그인
	async function login(page: Page) {
		await page.goto('/login');
		await page.getByRole('textbox', { name: /이메일/i }).fill('test@example.com');
		await page.locator('input[type="password"]').first().fill('test123');
		await page.locator('form button[type="submit"]').click();
		await page.waitForURL('/');
	}

	test('로그인 후 통계 페이지에 접근할 수 있어야 함', async ({ page }) => {
		await login(page);

		// 통계 탭 클릭
		await page.goto('/stats');
		await page.waitForLoadState('networkidle');

		// 헤더 확인
		await expect(page.getByRole('heading', { name: /감정 통계/i })).toBeVisible();
	});

	test('주간/월간 탭이 있어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/stats');
		await page.waitForLoadState('networkidle');

		// 주간/월간 버튼 확인
		const weekButton = page.getByRole('button', { name: /주간/i });
		const monthButton = page.getByRole('button', { name: /월간/i });

		await expect(weekButton).toBeVisible();
		await expect(monthButton).toBeVisible();
	});

	test('기본적으로 주간 통계가 선택되어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/stats');
		await page.waitForLoadState('networkidle');

		// 주간 버튼이 활성화되어 있는지 확인 (primary 색상)
		const weekButton = page.getByRole('button', { name: /주간/i });
		const classes = await weekButton.getAttribute('class');
		expect(classes).toContain('bg-(--color-primary)');
	});

	test('월간 탭을 클릭하면 월간 통계가 표시되어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/stats');
		await page.waitForLoadState('networkidle');

		// 월간 버튼 클릭
		await page.getByRole('button', { name: /월간/i }).click();
		await page.waitForTimeout(500); // API 호출 대기

		// 월간 버튼이 활성화되어 있는지 확인
		const monthButton = page.getByRole('button', { name: /월간/i });
		const classes = await monthButton.getAttribute('class');
		expect(classes).toContain('bg-(--color-primary)');
	});

	test('요약 카드에 총 일기와 스트릭이 표시되어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/stats');
		await page.waitForLoadState('networkidle');

		// 요약 섹션 확인
		await expect(page.getByText(/요약/i)).toBeVisible();
		await expect(page.getByText(/총 일기/i)).toBeVisible();
		await expect(page.getByText(/스트릭/i)).toBeVisible();
	});

	test('일기가 있으면 감정 분포 차트가 표시되어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/stats');
		await page.waitForLoadState('networkidle');

		// 통계가 0개인지 확인
		const totalText = await page.textContent('body');

		if (totalText && !totalText.includes('아직 일기가 없어요')) {
			// 일기가 있으면 감정 분포 차트 확인
			await expect(page.getByText(/감정 분포/i)).toBeVisible();

			// Canvas 요소 확인 (차트)
			const canvas = page.locator('canvas');
			await expect(canvas).toBeVisible();
		}
	});

	test('일기가 없으면 빈 상태 메시지가 표시되어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/stats');
		await page.waitForLoadState('networkidle');

		// 총 일기 수 확인
		const totalText = await page.textContent('body');

		if (totalText && totalText.includes('0개')) {
			// 빈 상태 메시지 확인
			await expect(page.getByText(/아직 일기가 없어요/i)).toBeVisible();
			await expect(page.getByText(/일기를 작성하면 감정 통계를 확인할 수 있어요/i)).toBeVisible();
		}
	});

	test('BottomNav에서 통계 탭을 클릭할 수 있어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/');

		// BottomNav의 통계 탭 찾기
		const statsTab = page.locator('a[href="/stats"]').last();
		await expect(statsTab).toBeVisible();

		// 통계 탭 클릭
		await statsTab.click();
		await page.waitForURL('/stats');

		// 통계 페이지 헤더 확인
		await expect(page.getByRole('heading', { name: /감정 통계/i })).toBeVisible();
	});

	test('통계 페이지에서 다른 페이지로 이동할 수 있어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/stats');
		await page.waitForLoadState('networkidle');

		// 기록 탭 클릭
		const recordTab = page.locator('a[href="/"]').first();
		await recordTab.click();
		await page.waitForURL('/');

		// 메인 페이지 확인
		await expect(page.locator('body')).toContainText(/오늘 하루|기록/i);
	});
});
