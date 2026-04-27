# Testing Patterns

**Analysis Date:** 2026-04-27

## Test Framework

**Runner:**
- Playwright v1.59.1
- Config: `yuting/playwright.config.ts`

**Assertion Library:**
- Playwright built-in assertions (`expect` from `@playwright/test`)

**Run Commands:**
```bash
npm run test:e2e           # Run all E2E tests (defined in yuting/package.json)
npx playwright test --ui   # Interactive UI mode
npx playwright test --reporter=html  # HTML report at playwright-report/index.html
```

## Test File Organization

**Location:**
- `yuting/tests/e2e/` — all E2E tests

**Naming:**
- `{feature}.spec.ts` — `home.spec.ts`, `navigation.spec.ts`, `album.spec.ts`, `login.spec.ts`, `profile.spec.ts`

**Structure:**
```
yuting/tests/
├── e2e/
│   ├── home.spec.ts         # Homepage / 3D room
│   ├── navigation.spec.ts   # Bottom nav navigation
│   ├── album.spec.ts        # Album page
│   ├── login.spec.ts        # Login page
│   └── profile.spec.ts      # Profile page
└── (no unit/ integration tests)
```

Test artifacts:
- `yuting/playwright-report/` — HTML report output
- `yuting/playwright-results.json` — JSON results file
- `yuting/test-results/` — test run artifacts (screenshots, videos on failure)

## Test Structure

**Suite Organization:**
All tests follow the same pattern:

```typescript
// From yuting/tests/e2e/navigation.spec.ts
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
});
```

**Patterns:**
- Each spec file uses a single `test.describe` block with a string label
- Tests navigate to pages via `page.goto(path)`
- Use `waitForLoadState('networkidle')` before assertions
- Assertions check visibility via `expect(locator).toBeVisible()` or text via `expect(locator).toContainText()`
- Some tests capture screenshots on success: `page.screenshot({ path: 'playwright-report/homepage.png' })`
- No `beforeEach` or `afterEach` hooks used
- No test fixtures or parameterized tests (`test.describe.parallel`, `test.skip`)
- Timeout set to 10000ms for visibility assertions

## Playwright Configuration

From `yuting/playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

Key settings:
- Auto-starts dev server (`npm run dev`) for testing
- Chromium-only (no Firefox/Safari/WebKit projects)
- CI mode: 2 retries, 1 worker, sequential execution
- Local dev mode: parallel execution, no retries, reuses existing server
- Traces and screenshots only on failure
- Video recording retained on failure
- Action timeout: 10s, Navigation timeout: 30s

## Mocking

**Not used.** Tests hit the actual Next.js dev server and Supabase backend. No mocked APIs, no stubbed network requests, no `page.route()` interception, no fixture data injection.

## Fixtures and Factories

**None defined.** No test data factories, no seed scripts, no test fixtures. Tests run against whatever state exists in the development environment. No Playwright `defineConfig` fixtures for reusable setup/teardown.

## Coverage

**Requirements:** None enforced.
- No Jest/Vitest for unit tests
- No coverage tooling configured
- No `coverage/` directory
- No `--coverage` flag in any npm script

**Coverage Gap:** The codebase has E2E tests only — zero unit tests. Critical data access functions in `yuting/src/lib/trips.ts` (582 lines of Supabase queries) have no unit test coverage.

## Test Types

### E2E Tests (5 spec files, 12 total tests)

Current test inventory:

| Spec File | Tests | Scope |
|-----------|-------|-------|
| `home.spec.ts` | 2 | Page title check, h1 visibility, nav item count (>=3) |
| `navigation.spec.ts` | 2 | Bottom nav visibility across 3 pages, album navigation click |
| `album.spec.ts` | 2 | Page loads, empty state or login prompt detection |
| `login.spec.ts` | 2 | Page loads with form elements, submit without valid email |
| `profile.spec.ts` | 4 | Page loads, stats section, couple binding, account section when not logged in |

**Total: 12 E2E tests, all superficial (page loads, element visibility)**

Tests never interact with authenticated flows — no trip creation, no photo upload, no profile editing, no couple binding acceptance.

### Unit Tests

**None.** No Jest, Vitest, or other unit test framework configured. No `*.test.ts` or `*.test.tsx` files exist anywhere in the project source code (outside `node_modules`).

### Integration Tests

**None.** No API endpoint tests, no Supabase query tests, no database integration tests.

### E2E Tests with Auth

**Gap:** All E2E tests run without authentication. Tests check for "login prompt" states but never actually log in to test authenticated flows (adding trips, uploading photos, editing profile). No Playwright auth setup or test user credentials exist.

## CI/CD Pipeline

**None configured.**
- No GitHub Actions workflows (`.github/workflows/` does not exist)
- No GitLab CI, CircleCI, or other CI config
- No CI references in Playwright config beyond `process.env.CI` flag check
- `deploy.sh` performs a local `git commit + git push origin main` — no build verification, no test execution

## Testing Gaps and Recommendations

### Critical Gaps

1. **No unit tests for `yuting/src/lib/trips.ts`**
   - 582 lines of data access logic (trips, photos, couples, auth)
   - All Supabase query construction, deduplication, error handling
   - Priority: **High** — this is the most critical code with zero coverage

2. **No unit tests for `yuting/src/lib/auth.ts`**
   - Auth functions (`signInWithPassword`, `signUp`, `signOut`) and `useAuth` hook
   - Priority: **High**

3. **No unit tests for `yuting/src/hooks/use-svg-zoom.ts`**
   - 138 lines of SVG pan/zoom logic with touch, mouse, and wheel handlers
   - Priority: **Medium** — complex interaction logic

4. **No authenticated E2E flows**
   - Tests never log in, so all trip/photo/couple functionality is untested
   - Need Playwright auth setup with test credentials or test user seeding
   - Priority: **High**

5. **No tests for form components**
   - `AddTripForm` and `EditTripForm` components (`yuting/src/components/add-trip-form.tsx`, `edit-trip-form.tsx`) are completely untested
   - Priority: **Medium**

6. **No tests for Mini Program**
   - `miniprogram/` has zero test infrastructure
   - WeChat mini programs can be tested with `miniprogram-simulate` or `jest-miniprogram`
   - Priority: **Low** — requires specialized tooling

7. **Single browser (Chromium only)**
   - No Firefox, Safari, or mobile browser testing
   - Priority: **Medium** for web app quality across devices

8. **No tests for cloud functions**
   - `cloudfunctions/trip/`, `cloudfunctions/couple/`, `cloudfunctions/photo/` — all untested
   - Priority: **Low** — WeChat Cloud testing requires dev environment

9. **No tests for map components**
   - `wood-map.tsx`, `province-map.tsx`, `city-map.tsx`, `leaflet-map.tsx`, `wood-relief-map.tsx`, `wood-relief-city-map.tsx` — all visual components with complex rendering logic, completely untested
   - Priority: **Medium** — visual regression testing would be most appropriate

### Recommended Additions

```bash
# Add Vitest for unit testing
npm install -D vitest @vitest/coverage-v8

# Suggested test file locations:
# yuting/src/lib/trips.test.ts
# yuting/src/lib/auth.test.ts
# yuting/src/hooks/use-svg-zoom.test.ts

# Add authenticated E2E setup
# Create tests/e2e/fixtures/auth.ts with login helper
# Create tests/e2e/fixtures/data.ts with test data seeding

# Add CI workflow
# .github/workflows/test.yml with Playwright + unit tests

# Add more browsers to Playwright config
# projects: [chromium, firefox, webkit]

# Add visual regression testing for map components
# Use @playwright/test built-in screenshot comparison
```

---

*Testing analysis: 2026-04-27*
