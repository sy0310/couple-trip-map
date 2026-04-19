import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the home page with 3D room', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/遇亭/);

    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('nav')).toBeVisible();

    await page.screenshot({ path: 'playwright-report/homepage.png' });
  });

  test('should have at least 3 nav items', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const navItems = page.locator('nav button, nav a');
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
