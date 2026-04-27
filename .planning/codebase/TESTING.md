# Testing Patterns

**Analysis Date:** 2026-04-26

## Test Framework

**Runner:**
- Playwright v1.59.1
- Config: `yuting/playwright.config.ts`

**Assertion Library:**
- Playwright built-in assertions (`expect` from `@playwright/test`)

**Run Commands:**
```bash
npm run test:e2e           # Run all E2E tests
npx playwright test --ui   # Interactive UI mode
npx playwright test --reporter=html  # HTML report
```

## Test File Organization

**Location:**
- `yuting/tests/e2e/` — all E2E tests

**Naming:**
- `{feature}.spec.ts` — `home.spec.ts`, `navigation.spec.ts`, `album.spec.ts`, `login.spec.ts`, `profile.spec.ts`

**Structure:**
```
yuting/tests/
└── e2e/
    ├── home.spec.ts         # Homepage / 3D room
    ├── navigation.spec.ts   # Bottom nav navigation
    ├── album.spec.ts        # Album page
    ├── login.spec.ts        # Login page
    └── profile.spec.ts      # Profile page
```

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
- Each spec file uses a single `test.describe` block
- Tests navigate to pages via `page.goto(path)`
- Use `waitForLoadState('networkidle')` before assertions
- Assertions check visibility of elements via `expect(locator).toBeVisible()`
- Some tests capture screenshots on success: `page.screenshot({ path: 'playwright-report/homepage.png' })`

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
- CI mode: 2 retries, 1 worker
- Traces and screenshots only on failure

## Mocking

**Not used.** Tests hit the actual Next.js dev server and Supabase backend. No mocked APIs, no stubbed network requests, no fixture data injection.

## Fixtures and Factories

**None defined.** No test data factories, no seed scripts, no test fixtures. Tests run against whatever state exists in the development environment.

## Coverage

**Requirements:** None enforced.
- No Jest/Vitest for unit tests
- No coverage tooling configured
- No `coverage/` directory

**Coverage Gap:** The codebase has E2E tests only — zero unit tests. Critical data access functions in `yuting/src/lib/trips.ts` (582 lines of Supabase queries) have no unit test coverage.

## Test Types

### E2E Tests (5 spec files)

Current test inventory:

| Spec File | Tests | Scope |
|-----------|-------|-------|
| `home.spec.ts` | 2 | Page title, h1 visibility, nav item count |
| `navigation.spec.ts` | 2 | Bottom nav visibility across pages, album navigation |
| `album.spec.ts` | 2 | Page loads, empty state/login prompt |
| `login.spec.ts` | 2 | Page loads, form visibility |
| `profile.spec.ts` | 4 | Page loads, stats section, couple binding, account section |

**Total: 12 E2E tests, all superficial (page loads, element visibility)**

### Unit Tests

**None.** No Jest, Vitest, or other unit test framework configured. No `*.test.ts` or `*.test.tsx` files exist anywhere in the project.

### Integration Tests

**None.** No API endpoint tests, no Supabase query tests, no database integration tests.

### E2E Tests with Auth

**Gap:** All E2E tests run without authentication. Tests check for "login prompt" states but never actually log in to test authenticated flows (adding trips, uploading photos, editing profile).

## CI/CD Pipeline

**None configured.**
- No GitHub Actions workflows (`.github/workflows/` does not exist)
- No CI references in Playwright config beyond `process.env.CI` flag
- `deploy.sh` performs a local `git push origin main` — no build verification, no test execution

## Testing Gaps and Recommendations

### Critical Gaps

1. **No unit tests for `yuting/src/lib/trips.ts`**
   - 582 lines of data access logic (trips, photos, couples, auth)
   - All Supabase query construction, deduplication, error handling
   - Priority: **High** — this is the most critical code with zero coverage

2. **No unit tests for `yuting/src/lib/auth.ts`**
   - Auth functions and `useAuth` hook
   - Priority: **High**

3. **No unit tests for `yuting/src/hooks/use-svg-zoom.ts`**
   - 138 lines of SVG pan/zoom logic with touch, mouse, and wheel handlers
   - Priority: **Medium** — complex interaction logic

4. **No authenticated E2E flows**
   - Tests never log in, so all trip/photo/couple functionality is untested
   - Need Playwright auth setup with test credentials
   - Priority: **High**

5. **No tests for form components**
   - `AddTripForm`, `EditTripForm` components are completely untested
   - Priority: **Medium**

6. **No tests for Mini Program**
   - `miniprogram/` has zero test infrastructure
   - WeChat mini programs can be tested with miniprogram-simulate or similar
   - Priority: **Low** — requires specialized tooling

7. **Single browser (Chromium only)**
   - No Firefox, Safari, or mobile browser testing
   - Priority: **Medium** for web app quality

### Recommended Additions

```bash
# Add Vitest for unit testing
npm install -D vitest @vitest/coverage-v8

# Add authenticated E2E setup
# Create tests/e2e/fixtures/auth.ts with login helper

# Add CI workflow
# .github/workflows/test.yml with Playwright + unit tests
```

---

*Testing analysis: 2026-04-26*
