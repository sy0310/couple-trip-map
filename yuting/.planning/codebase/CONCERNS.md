# Codebase Concerns

**Analysis Date:** 2026-04-20

## Tech Debt

**Duplicate Map Components:**
- Issue: Multiple overlapping map implementations exist simultaneously
  - `src/components/province-map.tsx` — Legacy ECharts-based province map
  - `src/components/province-map-leaflet.tsx` — Leaflet wrapper
  - `src/components/province-map-leaflet-inner.tsx` — Leaflet inner component
  - `src/components/city-map.tsx` — City-level Leaflet map
  - `src/components/leaflet-map.tsx` — Core Leaflet map
  - `src/components/wood-map.tsx` — Wooden-style map (possibly unused)
- Impact: Confusion about which component to use, maintenance burden, potential for inconsistent behavior
- Fix approach: Audit which components are actually imported, remove unused ones, consolidate into single map component with configurable props

**No API Route Layer:**
- Issue: All Supabase queries happen client-side in browser components
- Files: `src/lib/trips.ts`, `src/lib/auth.ts`
- Impact: Supabase anon key exposed in browser (by design, but no server-side validation), all RLS rules must be correct
- Fix approach: For production, consider adding Next.js API routes as a thin server-side layer for complex queries

**Supabase Client Singleton:**
- Issue: `src/lib/supabase-browser.ts` uses a global singleton `_client` that persists across requests in SSR context
- Impact: In Next.js SSR, this could cause auth state to leak between requests since the singleton is shared
- Fix approach: Use request-scoped client instead of global singleton, or rely on `@supabase/ssr` createServerClient everywhere

## Security Considerations

**`as never` Type Assertions:**
- 14 instances of `as never` casts across the codebase
- Files: `src/lib/trips.ts` (7), `src/components/leaflet-map.tsx` (3), `src/components/province-map-leaflet-inner.tsx` (2)
- Risk: These bypass TypeScript type checking — if Supabase schema changes, type mismatches won't be caught at compile time
- Recommendations: Regenerate `database.types.ts` from Supabase regularly; use proper type narrowing instead

**`console.error` in Production:**
- Multiple `console.error` calls in `src/lib/trips.ts` for Supabase failures
- Risk: Error messages may leak internal details in production console
- Recommendations: Replace with proper logging framework or strip in production builds

**Binding Code Collision Handling:**
- `generateBindingCode()` in `src/lib/trips.ts` uses recursion for retry on collision
- Risk: Theoretical stack overflow if collision rate is extremely high (unlikely with 6-char alphanumeric)
- Current mitigation: 36^6 = ~2.2 billion possible codes

## Performance Bottlenecks

**Photo Count N+1 Query:**
- `getVisitedCitiesWithCoords()` in `src/lib/trips.ts` loops through trip IDs and calls `getPhotosByTrip()` for each city
- Files: `src/lib/trips.ts:257-260`
- Impact: O(n) photo queries where n = number of unique cities — could be slow with many cities
- Improvement path: Single query with `IN (trip_ids)` for all photos, then group by trip_id in JavaScript

**Province Data File Size:**
- `src/lib/provinces.ts` (556 lines) contains all Chinese province/city/spot data as a large static object
- Impact: Loaded on every client-side navigation — increases bundle size
- Improvement path: Consider code-splitting or lazy-loading province data, or fetching from API

**No Pagination for Photos:**
- `getPhotosByTrip()` fetches all photo records without limit
- Risk: Unbounded growth as couples upload more photos per trip
- Improvement path: Add cursor or offset-based pagination

## Fragile Areas

**GeoJSON File Mapping:**
- Province name normalization relies on bidirectional mapping between china.json full names and PROVINCES short names
- Files: `src/lib/provinces.ts` (`normalizeProvinceName`, `GEOJSON_TO_PROVINCE`)
- Why fragile: Any mismatch between GeoJSON file naming and province data causes silent failures (map renders without boundary)
- Test coverage: None — no tests for province name normalization

**Municipality Special Case:**
- Province page has special handling for 北京/上海/天津/重庆 via `MUNICIPALITIES` set
- Files: `src/app/province/page.tsx`
- Why fragile: Two different rendering paths (city list vs city map) in same component, easy to introduce regressions
- Test coverage: None

**CSS Filter for Dark Tiles:**
- `leaflet-map.tsx` uses CSS `invert(1) hue-rotate(180deg)` to darken OSM tiles
- Why fragile: CSS filter approach is a hack — breaks if Leaflet adds new DOM elements, inconsistent across browsers
- Safe modification: Consider using a proper dark tile provider URL instead

## Missing Critical Features

**No Server Actions:**
- All data mutations happen via client-side Supabase calls
- Missing: Form action validation, server-side duplicate prevention, optimistic updates

**No Error Boundaries:**
- Only `Suspense` boundaries for loading states
- Risk: Entire app crashes on unhandled exceptions

## Test Coverage Gaps

**No Unit Tests:**
- Entire `src/lib/` directory (data access layer) is untested
- Risk: Breaking changes to trip CRUD, auth, or province data go unnoticed
- Priority: High

**No City/Province Page Tests:**
- E2E tests cover home, album, login, profile, navigation — but not city or province pages
- Risk: Map rendering, GeoJSON loading, and progress calculations untested
- Priority: High

**No Form Submission Tests:**
- `AddTripForm` and `EditTripForm` have no E2E coverage
- Risk: Trip creation/editing regressions undetected
- Priority: Medium

---

*Concerns audit: 2026-04-20*
