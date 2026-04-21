# Testing Patterns

**Analysis Date:** 2026-04-20

## Test Framework

**Runner:**
- Playwright 1.59.1
- Config: `playwright.config.ts`

**Assertion Library:**
- Playwright built-in (`@playwright/test`)

**Run Commands:**
```bash
npm run test:e2e              # Run all E2E tests
npx playwright test --ui      # UI mode for debugging
npx playwright test --headed  # Run with visible browser
```

## Test File Organization

**Location:**
- `tests/e2e/` — dedicated E2E test directory

**Naming:**
- `<feature>.spec.ts` pattern (`home.spec.ts`, `login.spec.ts`, `album.spec.ts`)

**Structure:**
```
tests/
└── e2e/
    ├── album.spec.ts
    ├── home.spec.ts
    ├── login.spec.ts
    ├── navigation.spec.ts
    └── profile.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the home page with 3D room', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/遇亭/);
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });
});
```

**Patterns:**
- `test.describe` for feature grouping
- `page.goto('/')` for navigation
- `expect(locator).toBeVisible()` for assertions
- Screenshots on key states: `await page.screenshot({ path: 'playwright-report/homepage.png' })`

## Mocking

**Framework:** None — tests hit real Supabase instance

**What to Mock:**
- Nothing currently mocked — E2E tests run against live application

## Fixtures and Factories

**Test Data:**
- No fixtures or factories — tests rely on existing database state

## Coverage

**Requirements:** None enforced — only E2E tests, no unit tests

## Test Types

**Unit Tests:**
- None — no Jest/Vitest setup

**Integration Tests:**
- None — data layer tested via E2E only

**E2E Tests:**
- Playwright with chromium + webkit projects
- Covers: homepage loading, navigation flow, login, album, profile
- Timeout: 10s for element visibility

## Common Patterns

**Async Testing:**
```typescript
test('should have at least 3 nav items', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const navItems = page.locator('nav button, nav a');
  const count = await navItems.count();
  expect(count).toBeGreaterThanOrEqual(3);
});
```

**Error Testing:**
- Not currently tested — no error state E2E tests

## Gaps

- No unit tests for `src/lib/trips.ts` functions
- No tests for `src/lib/auth.ts` (binding code generation, couple lookup)
- No tests for form submissions (add/edit trip)
- No tests for photo upload flow
- No accessibility testing
- No visual regression testing

---

*Testing analysis: 2026-04-20*
