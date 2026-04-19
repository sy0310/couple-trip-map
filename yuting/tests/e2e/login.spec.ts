import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/遇亭/);

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('发送登录链接');

    await page.screenshot({ path: 'playwright-report/login-page.png' });
  });

  test('should not submit without valid email', async ({ page }) => {
    await page.goto('/login');

    await page.locator('button[type="submit"]').click();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
