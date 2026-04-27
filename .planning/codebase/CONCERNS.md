# Codebase Concerns

**Analysis Date:** 2026-04-27

## CRITICAL

### Permissive RLS Policies — Any Authenticated User Can Modify Anyone's Data

**What:** All RLS policies in `yuting/migrations/001_initial_schema.sql` use `using (true)` for SELECT, INSERT, UPDATE, and DELETE on `trips` and `photos`. Storage bucket policies also use `bucket_id = 'photos'` without any owner check.
**Impact:** Any authenticated Supabase user can read, modify, or delete ALL trips and photos from ALL couples. There is no data isolation at the database level. The app-layer checks (couple ID filtering) are bypassable by anyone who crafts their own Supabase queries.
**Files:** `yuting/migrations/001_initial_schema.sql:75-116`
**Fix approach:** Replace `using (true)` with `auth.uid()`-based policies. For trips: `using (couple_id IN (SELECT id FROM couples WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()))`. For photos: join through trips to validate couple membership. Storage policies should restrict to user's own couple bucket path.

### Schema Mismatch Between Miniprogram and Web App

**What:** The miniprogram cloud functions use `partner1_openid` / `partner2_openid` columns in the `couples` table (`cloudfunctions/couple/index.js:43-46`), but the Supabase schema uses `user_a_id` / `user_b_id` (`yuting/migrations/001_initial_schema.sql:15-16`). These are different column names with different types (openid strings vs UUID foreign keys).
**Impact:** The two backends cannot share data. If the miniprogram and web app point to the same logical database, queries will fail. The `users` table in Supabase has `id uuid`, but the miniprogram uses WeChat `openid` strings — there is no mapping between the two identity systems.
**Files:** `cloudfunctions/couple/index.js`, `cloudfunctions/trip/index.js` vs `yuting/migrations/001_initial_schema.sql`
**Fix approach:** Unify the schema. Either add an `openid` column to the Supabase `users` table and map it, or create separate collections/tables for each backend.

### Users Table Has No RLS Policies Defined

**What:** RLS is enabled on `users` table (`yuting/migrations/001_initial_schema.sql:67`) but no policies are created for it.
**Impact:** With RLS enabled and no policies, ALL queries to `users` are denied by default. The `getCoupleInfo` RPC and any user lookup will fail silently.
**Files:** `yuting/migrations/001_initial_schema.sql:67`
**Fix approach:** Add policies like `create policy "Users can read own profile" on users for select using (id = auth.uid())`.

### `cover_url` Column Not in Schema

**What:** The web app code reads and writes `cover_url` on trips (`yuting/src/app/album/page.tsx:114`, `yuting/src/lib/trips.ts:227-228`), but the migration schema does not define this column on the `trips` table.
**Impact:** All `cover_url` operations silently fail or throw errors. Cover photo functionality is broken.
**Files:** `yuting/migrations/001_initial_schema.sql:23-37`, `yuting/src/app/album/page.tsx:114`, `yuting/src/lib/trips.ts:227`
**Fix approach:** Add `cover_url text` column to the `trips` table in migration.

## HIGH

### Miniprogram Index Page Uses Hardcoded Mock Data

**What:** `miniprogram/pages/index/index.js:16-29` has a `TODO` comment and returns hardcoded mock province data. The cloud function for loading trips exists but is never called from the index page.
**Impact:** The home page of the primary product (miniprogram) shows fake data. No real trip data is displayed.
**Files:** `miniprogram/pages/index/index.js:16`
**Fix approach:** Wire up `wx.cloud.callFunction({ name: 'trip/list' })` to load real data.

### Miniprogram Cloud Environment ID Not Configured

**What:** `miniprogram/app.js:11` has `env: 'your-env-id'` with a TODO comment. Without a real environment ID, all cloud function calls fail.
**Impact:** Entire miniprogram backend is non-functional until this is configured.
**Files:** `miniprogram/app.js:11`
**Fix approach:** Replace placeholder with actual WeChat Cloud environment ID. Consider using environment variable or build-time config.

### Race Condition in Binding Code Generation

**What:** `yuting/src/lib/trips.ts:19-50` generates a random code, checks if it exists, then inserts — without a database-level unique constraint on `binding_code` after it's been set to null. The Supabase schema has `binding_code text not null unique` but `acceptBindingCode` sets it to `null` after use, so the uniqueness constraint no longer applies. Two concurrent `generateBindingCode` calls can generate the same code and both pass the check.
**Impact:** Duplicate binding codes could be issued, allowing unintended couple pairing.
**Files:** `yuting/src/lib/trips.ts:32-43`
**Fix approach:** Use a database-generated code (e.g., UUID short form) or add a partial unique index: `CREATE UNIQUE INDEX idx_active_binding_code ON couples(binding_code) WHERE binding_code IS NOT NULL`. Also use a DB-side code generation function.

### Incomplete Miniprogram City Data

**What:** `miniprogram/pages/city/city.js:36-120` has hardcoded city attraction data for only a few cities (Beijing, Shanghai, Guangzhou, Shenzhen). All other cities show empty attraction lists.
**Impact:** Most cities display no attractions in the miniprogram.
**Files:** `miniprogram/pages/city/city.js`
**Fix approach:** Either load from cloud database `locations` collection or integrate with the `yuting/src/lib/provinces.ts` data source.

### No Authorization on Trip/Photo Updates in Web App

**What:** `updateTrip` and `deleteTrip` in `yuting/src/lib/trips.ts` do not verify that the current user belongs to the couple that owns the trip. Any authenticated user can pass a `tripId` belonging to another couple and modify or delete it (compounded by the permissive RLS).
**Impact:** Cross-couple data tampering is possible.
**Files:** `yuting/src/lib/trips.ts:464-489`, `yuting/src/lib/trips.ts:525-560`
**Fix approach:** Verify `couple_id` membership before update/delete. This is also a database-level fix (see RLS section above).

### Sequential Photo Deletion in deleteTrip

**What:** `yuting/src/lib/trips.ts:529-540` loops through photos one at a time, making a separate Supabase storage delete call for each. No parallelization.
**Impact:** Slow for trips with many photos. If one deletion fails, subsequent ones may not execute (no transaction).
**Files:** `yuting/src/lib/trips.ts:529-540`
**Fix approach:** Use `supabase.storage.from('photos').remove(paths[])` with batch delete. Wrap DB operations in a transaction.

### Fragile Storage Path Extraction from URL

**What:** `yuting/src/lib/trips.ts:498-501` and `yuting/src/lib/trips.ts:533-536` extract storage path by splitting the URL on `/` and taking the last two segments. If the Supabase URL format changes or includes query params, this breaks.
**Impact:** Photo deletion fails silently — DB record deleted but storage file orphaned.
**Files:** `yuting/src/lib/trips.ts:498-501`, `yuting/src/lib/trips.ts:533-536`
**Fix approach:** Store the storage path (`coupleId/uuid.ext`) directly in the `photos` table instead of reconstructing from URL.

### N+1 Query Pattern in getVisitedCitiesWithCoords

**What:** Lines 256-259 of `yuting/src/lib/trips.ts` loop through each trip and call `getPhotosByTrip(tripId)` — one Supabase query per trip.
**Impact:** Performance degrades linearly with trip count. 20 cities = 20 separate queries for photos.
**Files:** `yuting/src/lib/trips.ts:256-259`
**Fix approach:** Fetch all photos in a single query with `.in('trip_id', tripIds)` and group by `trip_id` client-side.

### Auth Callback Page Uses Singleton Client

**What:** `yuting/src/app/auth/callback/page.tsx:14` creates a Supabase client via the singleton `createClient()` which does not handle cookies or auth state exchange properly for server-side contexts.
**Impact:** Auth callback may fail to properly exchange the code for a session in some browser contexts.
**Files:** `yuting/src/app/auth/callback/page.tsx`
**Fix approach:** Use the `@supabase/ssr` createClient with cookie handling (same pattern as `middleware.ts`).

## MEDIUM

### All Client Components, No SSR

**What:** Every page in `yuting/src/app/` uses `'use client'`. No server components, no SSR data fetching.
**Impact:** Initial page load requires full client-side fetch. Defeats Next.js App Router benefits (SSR, streaming, SEO, faster TTFB).
**Files:** `yuting/src/app/page.tsx`, `yuting/src/app/province/page.tsx`, `yuting/src/app/city/page.tsx`, `yuting/src/app/album/page.tsx`, `yuting/src/app/profile/page.tsx`
**Fix approach:** Migrate data fetching to Server Components where possible. Pass data as props to client components.

### window.location.href Navigation Causes Full Page Reloads

**What:** Web app uses `window.location.href` for cross-page navigation instead of Next.js client-side routing.
**Impact:** Loses app state on every navigation, slower transitions, poor UX.
**Files:** `yuting/src/app/page.tsx:68-80`, `yuting/src/app/province/page.tsx:96-100`, `yuting/src/app/city/page.tsx:160`
**Fix approach:** Use `useRouter` from `next/navigation` or `Link` from `next/link`.

### Untyped Supabase Queries via `as never` Assertions

**What:** 22 instances of `as never`, `as unknown`, and `as any` type assertions throughout the codebase bypass Supabase's generated TypeScript types.
**Impact:** Schema changes won't be caught at compile time. Type mismatches can cause runtime errors.
**Files:** `yuting/src/lib/trips.ts:43,76,328,330,353,451,480`, `yuting/src/app/profile/page.tsx:121`, `yuting/src/app/album/page.tsx:114`, multiple leaflet map components
**Fix approach:** Fix insert data shapes to match generated `Insert` types. Use proper generic type parameters on `.select()` calls.

### No CI/CD Pipeline

**What:** No GitHub Actions or any CI workflow. `deploy.sh` does a local `git commit` with a hardcoded message and `git push origin main` with no build verification or test execution.
**Impact:** Broken builds can be pushed to production. No automated quality gates.
**Files:** `deploy.sh`
**Fix approach:** Add `.github/workflows/ci.yml` with type check, lint, build, and test steps.

### Singleton Supabase Client

**What:** `yuting/src/lib/supabase-browser.ts` creates a single global client instance. No auth state isolation between concurrent requests or SSR contexts.
**Impact:** Potential issues with SSR/edge contexts, stale auth state, concurrent request interference.
**Files:** `yuting/src/lib/supabase-browser.ts`
**Fix approach:** Use `@supabase/ssr` pattern already used in middleware — create fresh client per request/context.

### No Schema Validation at Boundaries

**What:** No Zod or schema validation library. All form validation is manual in form handlers. Supabase insert data uses `as never` to bypass types.
**Impact:** Malformed data can reach the database. No centralized validation logic.
**Files:** `yuting/src/components/add-trip-form.tsx`, `yuting/src/components/edit-trip-form.tsx`, `yuting/src/lib/trips.ts`
**Fix approach:** Add Zod schemas for trip, photo, and couple data. Validate at form submission and before Supabase inserts.

### console.error Throughout Production Code

**What:** 17 `console.*` calls in `yuting/src/` source files. No structured logging framework. Per project rules (`common/coding-style.md`), no `console.log` in production code.
**Impact:** Errors are invisible in production. No alerting or monitoring.
**Files:** `yuting/src/lib/trips.ts` (15 instances), `yuting/src/components/wood-map.tsx`, `yuting/src/lib/provinces.ts`
**Fix approach:** Replace with a proper logging library or error tracking service (e.g., Sentry).

### Single Browser E2E Testing

**What:** Playwright config only tests Chromium. No Firefox, Safari, or mobile browser coverage.
**Impact:** Browser-specific bugs won't be caught.
**Files:** `yuting/playwright.config.ts:21-22`
**Fix approach:** Add Firefox and WebKit projects to Playwright config.

### No Authenticated E2E Flows

**What:** All E2E tests run without authentication. The login test only verifies the page renders — it does not test actual login flow. Trip/photo/couple functionality is completely untested.
**Impact:** Core product features have zero E2E coverage.
**Files:** `yuting/tests/e2e/*.spec.ts`
**Fix approach:** Add Playwright auth setup with test credentials. Test authenticated flows.

### Heavy Inline Styles in Key Components

**What:** `room-3d.tsx`, `wood-map.tsx`, and other visual components rely heavily on inline style objects for gradients, shadows, and colors.
**Impact:** Makes theming and responsive adjustments difficult. Duplicates color values across components.
**Files:** `yuting/src/components/room-3d.tsx`, `yuting/src/components/wood-map.tsx`, `yuting/src/app/profile/page.tsx`
**Fix approach:** Extract color/gradient values to CSS custom properties in `globals.css`.

### Large Data File — provinces.ts at 556 Lines

**What:** `yuting/src/lib/provinces.ts` contains 556 lines of hardcoded province/city/scenic spot data. Any update requires editing a large file.
**Impact:** Hard to maintain, no external update mechanism, file exceeds recommended 400-line guideline.
**Files:** `yuting/src/lib/provinces.ts`
**Fix approach:** Move province data to a separate JSON file or database. Consider fetching from an API.

### No Photo File Size Validation

**What:** `yuting/src/components/add-trip-form.tsx:34-35` filters by `f.type.startsWith('image/')` but does not check file size. `yuting/src/lib/trips.ts:370-388` uploads directly to Supabase without size limits.
**Impact:** Users can upload arbitrarily large images, increasing storage costs and page load times.
**Files:** `yuting/src/components/add-trip-form.tsx:34`, `yuting/src/lib/trips.ts:370-388`
**Fix approach:** Add file size validation (e.g., max 10MB) client-side and enforce limits in Supabase storage policies.

### Memory Leak Risk from URL.createObjectURL

**What:** `yuting/src/components/add-trip-form.tsx:38` and `yuting/src/components/edit-trip-form.tsx:38` create blob URLs via `URL.createObjectURL` but only revoke them when the user manually removes a photo. If the user submits the form without removing previews, the blob URLs are never released.
**Impact:** Memory leak in the browser session over time.
**Files:** `yuting/src/components/add-trip-form.tsx:38-40`, `yuting/src/components/edit-trip-form.tsx:38-40`
**Fix approach:** Revoke all preview URLs in a `useEffect` cleanup and after form submission.

### Binding Code Uses Weak Random (Miniprogram)

**What:** `miniprogram/pages/profile/profile.js:57-61` and `cloudfunctions/couple/index.js:269-275` generate binding codes using `Math.random()`. The cloud function version checks uniqueness with a retry loop, but the client-side version in profile.js generates a 6-char code locally without any uniqueness check.
**Impact:** Collision risk for binding codes, especially the client-side generated ones.
**Files:** `miniprogram/pages/profile/profile.js:57-61`, `cloudfunctions/couple/index.js:269-275`
**Fix approach:** Always generate codes server-side. Use crypto-grade randomness.

## LOW

### No Unit Test Coverage for Data Layer

**What:** `yuting/src/lib/trips.ts` (581 lines) — all CRUD operations for trips, photos, couples — has zero unit tests. Only 5 E2E tests exist, all unauthenticated.
**Impact:** Any change to Supabase query construction, deduplication logic, or error handling is untested.
**Files:** `yuting/src/lib/trips.ts` (entire file)
**Fix approach:** Add Vitest unit tests for core data functions.

### Login Cloud Function Has No index.js

**What:** `cloudfunctions/login/` contains only a README with example code — no actual `index.js`.
**Impact:** Login cloud function is non-functional.
**Files:** `cloudfunctions/login/`
**Fix approach:** Implement or remove the login function.

### Deprecated next-pwa Version

**What:** `next-pwa@5.6.0` is quite old and may have compatibility issues with Next.js 16.
**Impact:** PWA features may break after Next.js upgrades.
**File:** `yuting/package.json:20`
**Fix approach:** Evaluate whether PWA is still needed or migrate to a Next.js 16-compatible PWA solution.

### No Mini Program Test Infrastructure

**What:** `miniprogram/` has zero test infrastructure.
**Impact:** Miniprogram changes are untested.
**Fix approach:** Consider `miniprogram-simulate` or similar for basic page testing.

### No Prettier or Auto-Format

**What:** No `.prettierrc` or formatter configured.
**Impact:** Inconsistent code style across contributors.
**Fix approach:** Add Prettier config and wire a PostToolUse hook.

### deploy.sh Hardcodes Commit Message

**What:** `deploy.sh:20-29` uses a hardcoded commit message regardless of actual changes.
**Impact:** Git history becomes meaningless. Cannot track what changed when.
**Files:** `deploy.sh:20-29`
**Fix approach:** Use interactive commit or require a message argument.

---

*Concerns audit: 2026-04-27*
