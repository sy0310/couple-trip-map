import { test, expect } from '@playwright/test';

test.describe('Album', () => {
  test('should load the album page', async ({ page }) => {
    await page.goto('/album');
    await page.waitForLoadState('networkidle');

    // Without login, shows "请先登录"
    await expect(page.getByRole('heading', { name: '旅行相册' })).toBeVisible({ timeout: 10000 });
  });

  test('should show empty state or login prompt', async ({ page }) => {
    await page.goto('/album');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').innerText();
    expect(
      body.includes('还没有') || body.includes('请先登录') || body.includes('加载')
    ).toBeTruthy();
  });
});
