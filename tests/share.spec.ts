import { test, expect, type Page } from '@playwright/test';

test.describe('공유 기능 (Share Feature)', () => {
	// 헬퍼: 로그인 및 일기 상세 페이지로 이동
	async function loginAndGoToJournal(page: Page) {
		// 로그인
		await page.goto('/login');
		await page.getByRole('textbox', { name: /이메일/i }).fill('test@example.com');
		await page.locator('input[type="password"]').first().fill('test123');
		await page.locator('form button[type="submit"]').click();

		// 캘린더로 이동
		await page.waitForURL('/');
		await page.goto('/calendar');

		// 일기가 있는 날짜 찾기 (감정 이모지가 있는 버튼)
		const journalButton = page.locator('button:has(span.text-base)').first();
		const count = await journalButton.count();

		if (count === 0) {
			return false; // 일기 없음
		}

		// 일기 클릭 → 모달 열림
		await journalButton.click();

		// "자세히 보기" 클릭
		await page.getByRole('button', { name: /자세히 보기/i }).click();

		// 일기 상세 페이지 대기
		await page.waitForURL(/\/journal\//);

		return true; // 성공
	}

	test('일기 상세 페이지에 공유 버튼이 있어야 함', async ({ page }) => {
		const success = await loginAndGoToJournal(page);
		if (!success) {
			test.skip();
			return;
		}

		// 공유 버튼 확인
		const shareButton = page.getByRole('button', { name: /공유하기/i });
		await expect(shareButton).toBeVisible();
	});

	test('공유 버튼 클릭 시 모달이 열려야 함', async ({ page }) => {
		const success = await loginAndGoToJournal(page);
		if (!success) {
			test.skip();
			return;
		}

		// 공유 버튼 클릭
		await page.getByRole('button', { name: /공유하기/i }).click();

		// 모달 확인
		const modal = page.getByRole('dialog');
		await expect(modal).toBeVisible({ timeout: 10000 });

		// 모달 제목 확인
		await expect(page.getByText('공유하기')).toBeVisible();
	});

	test('공유 모달에서 이미지가 생성되어야 함', async ({ page }) => {
		const success = await loginAndGoToJournal(page);
		if (!success) {
			test.skip();
			return;
		}

		// 공유 버튼 클릭
		await page.getByRole('button', { name: /공유하기/i }).click();

		// 로딩 상태 확인
		const loadingText = page.getByText(/이미지 생성 중/i);
		const isLoading = await loadingText.count();

		if (isLoading > 0) {
			await expect(loadingText).toBeVisible();
		}

		// 이미지가 생성될 때까지 대기 (최대 15초)
		const shareImage = page.locator('img[alt="공유 이미지"]');
		await expect(shareImage).toBeVisible({ timeout: 15000 });

		// 이미지 src가 blob URL인지 확인
		const imageSrc = await shareImage.getAttribute('src');
		expect(imageSrc).toMatch(/^blob:/);
	});

	test('저장 버튼이 활성화되어야 함', async ({ page }) => {
		const success = await loginAndGoToJournal(page);
		if (!success) {
			test.skip();
			return;
		}

		// 공유 모달 열기
		await page.getByRole('button', { name: /공유하기/i }).click();

		// 이미지 생성 대기
		await expect(page.locator('img[alt="공유 이미지"]')).toBeVisible({ timeout: 15000 });

		// 저장 버튼 확인
		const saveButton = page.getByRole('button', { name: /저장/i });
		await expect(saveButton).toBeVisible();
		await expect(saveButton).toBeEnabled();
	});

	test('공유 버튼이 활성화되어야 함', async ({ page }) => {
		const success = await loginAndGoToJournal(page);
		if (!success) {
			test.skip();
			return;
		}

		// 공유 모달 열기
		await page.getByRole('button', { name: /공유하기/i }).click();

		// 이미지 생성 대기
		await expect(page.locator('img[alt="공유 이미지"]')).toBeVisible({ timeout: 15000 });

		// 공유 버튼 확인 (모달 내의 공유 버튼)
		const shareButtonInModal = page.locator('button:has-text("공유")').last();
		await expect(shareButtonInModal).toBeVisible();
		await expect(shareButtonInModal).toBeEnabled();
	});

	test('ESC 키로 모달을 닫을 수 있어야 함', async ({ page }) => {
		const success = await loginAndGoToJournal(page);
		if (!success) {
			test.skip();
			return;
		}

		// 공유 모달 열기
		await page.getByRole('button', { name: /공유하기/i }).click();

		// 모달 확인
		const modal = page.getByRole('dialog');
		await expect(modal).toBeVisible();

		// ESC 키 누르기
		await page.keyboard.press('Escape');

		// 모달이 닫혔는지 확인
		await expect(modal).not.toBeVisible();
	});

	test('닫기 버튼으로 모달을 닫을 수 있어야 함', async ({ page }) => {
		const success = await loginAndGoToJournal(page);
		if (!success) {
			test.skip();
			return;
		}

		// 공유 모달 열기
		await page.getByRole('button', { name: /공유하기/i }).click();

		// 모달 확인
		const modal = page.getByRole('dialog');
		await expect(modal).toBeVisible();

		// 닫기 버튼 클릭
		const closeButton = page.getByRole('button', { name: /닫기/i });
		await closeButton.click();

		// 모달이 닫혔는지 확인
		await expect(modal).not.toBeVisible();
	});

	test('모달 외부 클릭으로 모달을 닫을 수 있어야 함', async ({ page }) => {
		const success = await loginAndGoToJournal(page);
		if (!success) {
			test.skip();
			return;
		}

		// 공유 모달 열기
		await page.getByRole('button', { name: /공유하기/i }).click();

		// 모달 확인
		const modal = page.getByRole('dialog');
		await expect(modal).toBeVisible();

		// 모달 배경(외부) 클릭
		const backdrop = page.locator('.fixed.inset-0.bg-black\\/50');
		await backdrop.click({ position: { x: 10, y: 10 } });

		// 모달이 닫혔는지 확인
		await expect(modal).not.toBeVisible();
	});
});
