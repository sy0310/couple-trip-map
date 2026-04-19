import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test('should load the profile page', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1')).toContainText('个人中心');
  });

  test('should show stats section', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=旅行统计')).toBeVisible();
    await expect(page.locator('text=去过的省份')).toBeVisible();
    await expect(page.locator('text=旅行次数')).toBeVisible();
    await expect(page.locator('text=完成度')).toBeVisible();
  });

  test('should show couple binding section', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=情侣绑定')).toBeVisible();
  });

  test('should show account section when not logged in', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const body = await page.locator('body').innerText();
    expect(body.includes('登录') || body.includes('Supabase')).toBeTruthy();
  });
});
