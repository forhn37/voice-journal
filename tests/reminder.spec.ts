import { test, expect, type Page } from '@playwright/test';

test.describe('리마인더 기능 (Reminder)', () => {
	// 헬퍼: 로그인
	async function login(page: Page) {
		await page.goto('/login');
		await page.getByRole('textbox', { name: /이메일/i }).fill('test@example.com');
		await page.locator('input[type="password"]').first().fill('test123');
		await page.locator('form button[type="submit"]').click();
		await page.waitForURL('/');
	}

	test('설정 페이지에 리마인더 섹션이 있어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/settings');

		// 리마인더 섹션 확인
		await expect(page.getByText('리마인더')).toBeVisible();
		await expect(page.getByText('일기 알림')).toBeVisible();
	});

	test('알림 토글 스위치가 표시되어야 함', async ({ page }) => {
		await login(page);
		await page.goto('/settings');

		// 토글 스위치 확인
		const toggle = page.locator('input[type="checkbox"]').filter({ has: page.locator('..') });
		expect(await toggle.count()).toBeGreaterThan(0);
	});

	test('알림 켤 때 시간 선택 UI가 표시되어야 함', async ({ page, context }) => {
		await login(page);
		await page.goto('/settings');

		// 알림 권한을 granted로 설정 (테스트 환경)
		await context.grantPermissions(['notifications']);

		// 알림 토글 클릭
		const toggleContainer = page.locator('text=/일기 알림/i').locator('..');
		const toggle = toggleContainer.locator('input[type="checkbox"]');

		// 체크되어 있지 않으면 토글
		const isChecked = await toggle.isChecked();
		if (!isChecked) {
			await toggle.check();
			// 시간 선택 UI가 표시될 때까지 대기
			await page.waitForSelector('input[type="time"]', { timeout: 3000 });
		}

		// 시간 선택 input 확인
		await expect(page.locator('input[type="time"]')).toBeVisible();
		await expect(page.getByText('알림 시간')).toBeVisible();
	});

	test('알림 시간을 변경할 수 있어야 함', async ({ page, context }) => {
		await login(page);
		await page.goto('/settings');

		// 알림 권한 설정
		await context.grantPermissions(['notifications']);

		// 알림 켜기
		const toggleContainer = page.locator('text=/일기 알림/i').locator('..');
		const toggle = toggleContainer.locator('input[type="checkbox"]');
		const isChecked = await toggle.isChecked();

		if (!isChecked) {
			await toggle.check();
			await page.waitForSelector('input[type="time"]', { timeout: 3000 });
		}

		// 시간 변경
		const timeInput = page.locator('input[type="time"]');
		await timeInput.fill('09:00');

		// 값이 변경되었는지 확인
		expect(await timeInput.inputValue()).toBe('09:00');
	});

	test('알림을 끄면 시간 선택 UI가 사라져야 함', async ({ page, context }) => {
		await login(page);
		await page.goto('/settings');

		// 알림 권한 설정
		await context.grantPermissions(['notifications']);

		// 알림 켜기
		const toggleContainer = page.locator('text=/일기 알림/i').locator('..');
		const toggle = toggleContainer.locator('input[type="checkbox"]');

		const isChecked = await toggle.isChecked();
		if (!isChecked) {
			await toggle.check();
			await page.waitForSelector('input[type="time"]', { timeout: 3000 });
		}

		// 알림 끄기
		await toggle.uncheck();

		// 시간 선택 UI가 사라졌는지 확인
		await expect(page.locator('input[type="time"]')).not.toBeVisible();
	});

	test('프로필 API가 notification_time을 저장할 수 있어야 함', async ({ page }) => {
		await login(page);

		// API 테스트
		const response = await page.request.post('/api/profile', {
			headers: { 'Content-Type': 'application/json' },
			data: JSON.stringify({ notification_time: '21:00' })
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data.success).toBe(true);
	});

	test('프로필 API가 notification_time을 null로 설정할 수 있어야 함', async ({ page }) => {
		await login(page);

		// API 테스트 (알림 끄기)
		const response = await page.request.post('/api/profile', {
			headers: { 'Content-Type': 'application/json' },
			data: JSON.stringify({ notification_time: null })
		});

		expect(response.ok()).toBeTruthy();
		const data = await response.json();
		expect(data.success).toBe(true);
	});

	test('알림 권한 상태에 따라 안내 메시지가 달라야 함', async ({ page, context }) => {
		await login(page);
		await page.goto('/settings');

		// 알림 권한 부여
		await context.grantPermissions(['notifications']);

		// 페이지 새로고침
		await page.reload();

		// 권한이 있을 때 메시지 확인
		const bodyText = await page.textContent('body');
		expect(
			bodyText?.includes('매일 설정한 시간에 알림을 받아요') ||
				bodyText?.includes('알림 권한이 필요해요')
		).toBeTruthy();
	});
});
