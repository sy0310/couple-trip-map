# Codebase Concerns

**Analysis Date:** 2026-04-26

## CRITICAL

### No Unit Test Coverage for Data Layer

**What:** `yuting/src/lib/trips.ts` (582 lines) — all CRUD operations for trips, photos, couples — has zero unit tests. Zero `*.test.ts` files exist anywhere in the project.
**Impact:** Any change to Supabase query construction, deduplication logic, or error handling is untested. Bugs in data layer affect every feature.
**File:** `yuting/src/lib/trips.ts` (entire file)
**Recommendation:** Add Vitest unit tests for at least the core data functions. Prioritize `getCoupleId`, `createTrip`, `uploadPhotosToTrip`, and the deduplication logic in `getVisitedCitiesWithCoords`.

### N+1 Query Pattern in getVisitedCitiesWithCoords

**What:** Lines 256-259 loop through each trip and call `getPhotosByTrip(tripId)` — one Supabase query per trip.
**Impact:** Performance degrades linearly with trip count. 20 trips = 20 separate queries.
**File:** `yuting/src/lib/trips.ts:256-259`
**Recommendation:** Fetch all photos in a single query with `.in('trip_id', tripIds)` and group by `trip_id` client-side.

### All Client Components, No SSR

**What:** Every page in `yuting/src/app/` uses `'use client'`. No server components, no SSR data fetching.
**Impact:** Initial page load requires full client-side fetch. Defeats Next.js App Router benefits (SSR, streaming, SEO, faster TTFB).
**Files:** `yuting/src/app/page.tsx`, `yuting/src/app/province/page.tsx`, `yuting/src/app/city/page.tsx`, `yuting/src/app/album/page.tsx`, `yuting/src/app/profile/page.tsx`
**Recommendation:** Migrate data fetching to Server Components where possible. Pass data as props to client components.

## HIGH

### window.location.href Navigation

**What:** Web app uses `window.location.href` for cross-page navigation, causing full page reloads instead of Next.js client-side routing.
**Impact:** Loses app state on every navigation, slower transitions, poor UX.
**Files:** `yuting/src/app/page.tsx:68`, `yuting/src/app/province/page.tsx:96`, city page back buttons
**Recommendation:** Use `useRouter` from `next/navigation` or `Link` from `next/link`.

### Untyped Supabase Queries

**What:** Extensive use of `as { data: ... }` and `as never` type assertions throughout `trips.ts`, bypassing Supabase's generated TypeScript types.
**Impact:** Schema changes won't be caught at compile time. Type mismatches can cause runtime errors.
**File:** `yuting/src/lib/trips.ts` (multiple instances)
**Recommendation:** Fix insert data shapes to match generated `Insert` types. Use proper generic type parameters on `.select()` calls.

### No CI/CD Pipeline

**What:** No GitHub Actions or any CI workflow. `deploy.sh` does a local `git push origin main` with no build verification or test execution.
**Impact:** Broken builds can be pushed to production. No automated quality gates.
**File:** `deploy.sh`
**Recommendation:** Add `.github/workflows/ci.yml` with type check, lint, build, and test steps.

### Singleton Supabase Client

**What:** `yuting/src/lib/supabase-browser.ts` creates a single global client instance. No auth state isolation between concurrent requests.
**Impact:** Potential issues with SSR/edge contexts, stale auth state, concurrent request interference.
**File:** `yuting/src/lib/supabase-browser.ts`
**Recommendation:** Use `@supabase/ssr` pattern already used in middleware — create fresh client per request/context.

### No Schema Validation at Boundaries

**What:** No Zod or schema validation library. All form validation is manual in form handlers. Supabase insert data uses `as never` to bypass types.
**Impact:** Malformed data can reach the database. No centralized validation logic.
**Files:** `yuting/src/components/add-trip-form.tsx`, `yuting/src/components/edit-trip-form.tsx`, `yuting/src/lib/trips.ts`
**Recommendation:** Add Zod schemas for trip, photo, and couple data. Validate at form submission and before Supabase inserts.

## MEDIUM

### Mixed Styling Approaches

**What:** Components mix Tailwind utility classes with extensive inline `style` objects and occasional custom CSS classes.
**Impact:** Hard to refactor, prevents theme changes via CSS alone, visual inconsistency risk.
**Files:** Multiple components across `yuting/src/components/`
**Recommendation:** Use CSS custom properties for colors/shadows, Tailwind for layout. Keep inline styles to truly dynamic values only.

### console.error Throughout Production Code

**What:** 15 `console.error` calls in `yuting/src/lib/trips.ts` alone. No structured logging framework.
**Impact:** Per project rules, no console.log/error in production code. Errors are invisible in production.
**File:** `yuting/src/lib/trips.ts` (15 instances)
**Recommendation:** Replace with a proper logging library or error tracking service.

### Single Browser E2E Testing

**What:** Playwright config only tests Chromium. No Firefox, Safari, or mobile browser coverage.
**Impact:** Browser-specific bugs won't be caught.
**File:** `yuting/playwright.config.ts:91-93`
**Recommendation:** Add Firefox and WebKit projects to Playwright config.

### No Authenticated E2E Flows

**What:** All 12 E2E tests run without authentication. No login, so trip/photo/couple functionality is completely untested.
**Impact:** Core product features have zero E2E coverage.
**Files:** `yuting/tests/e2e/*.spec.ts`
**Recommendation:** Add Playwright auth setup with test credentials. Test authenticated flows.

### Heavy Inline Styles in Key Components

**What:** `room-3d.tsx`, `wood-relief-map.tsx`, and other visual components rely heavily on inline style objects for gradients, shadows, and colors.
**Impact:** Makes theming and responsive adjustments difficult. Duplicates color values.
**Files:** `yuting/src/components/room-3d.tsx`, `yuting/src/components/wood-relief-map.tsx`
**Recommendation:** Extract color/gradient values to CSS custom properties in `globals.css`.

## LOW

### No Prettier or Auto-Format

**What:** No `.prettierrc` or formatter configured. No PostToolUse hook for formatting.
**Impact:** Inconsistent code style across contributors.
**Recommendation:** Add Prettier config and wire a PostToolUse hook to auto-format on save.

### Login Cloud Function Has No index.js

**What:** `cloudfunctions/login/` contains only a README with example code — no actual `index.js`.
**Impact:** Login cloud function is non-functional.
**File:** `cloudfunctions/login/`
**Recommendation:** Implement or remove the login function.

### Deprecated next-pwa Version

**What:** `next-pwa@5.6.0` is quite old and may have compatibility issues with Next.js 16.
**Impact:** PWA features may break after Next.js upgrades.
**File:** `yuting/package.json`
**Recommendation:** Evaluate whether PWA is still needed or migrate to a Next.js 16-compatible PWA solution.

### No Mini Program Test Infrastructure

**What:** `miniprogram/` has zero test infrastructure.
**Impact:** Mini program changes are untested.
**Recommendation:** Consider `miniprogram-simulate` or similar for basic page testing. Low priority given specialized tooling needs.

---

*Concerns analysis: 2026-04-26*
