import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have bottom navigation on all pages', async ({ page }) => {
    const paths = ['/', '/album', '/profile'];

    for (const path of paths) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate via bottom nav', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Nav items are <a> tags (Next.js Link)
    const navLinks = nav.locator('a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Click album nav
    await navLinks.nth(1).click();
    await page.waitForLoadState('networkidle');

    // Should show album page content
    await expect(page.getByRole('heading', { name: '旅行相册' })).toBeVisible({ timeout: 10000 });
  });
});
