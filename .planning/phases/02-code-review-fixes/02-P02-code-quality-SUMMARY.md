---
phase: 02-code-review-fixes
plan: 02
subsystem: code-quality
tags: [postgrest, storage, imports, query-optimization]
dependency_graph:
  requires: [01]
  provides: [QUAL-02, QUAL-03, QUAL-04, QUAL-05, QUAL-06]
  affects: [supabase.ts, storage.ts, trips.ts, index.tsx, auth.ts]
tech_stack:
  added: []
  patterns: [PostgREST query builder, static ES module imports, URL constructor parsing]
key_files:
  created: []
  modified:
    - taro-app/src/services/supabase.ts
    - taro-app/src/services/storage.ts
    - shared/lib/trips.ts
    - taro-app/src/pages/index/index.tsx
    - taro-app/src/services/auth.ts
decisions: []
metrics:
  duration: ~5m
  completed: 2026-05-02
  tasks: 3
  files: 5
---

# Phase 02 Plan 02: Code Quality Fixes Summary

## One-liner

Fixed 5 MEDIUM code quality issues: PostgREST .in() string quoting, base64 upload header duplication, fragile URL parsing, dynamic require() anti-pattern, and select('*') over-fetching.

## Tasks Completed

### Task 1: PostgREST .in() quoting + Storage header fix

**Files:** `taro-app/src/services/supabase.ts`, `taro-app/src/services/storage.ts`

- **D-09 (supabase.ts):** The `.in()` query builder now wraps string values in double quotes for proper PostgREST parsing. Numeric values remain unquoted. This prevents PostgREST from misinterpreting comma-separated string values.
- **D-10 (storage.ts):** The base64 upload fallback now calls `this.headers()` without a contentType argument (getting only apikey + Authorization), then sets a single `Content-Type: contentType + '; base64'` header. Previously, `this.headers(contentType + '; base64')` set Content-Type in the spread, then `'Content-Type': contentType` overwrote it — losing the base64 suffix.

**Commit:** `9415a5a` — fix: quote string values in .in() query builder + fix base64 upload Content-Type duplication

### Task 2: Photo URL parsing via URL constructor

**Files:** `shared/lib/trips.ts`

- **D-11a (deleteTrip):** Replaced naive `split('/')` URL parsing with `new URL()` constructor + `pathname.split('/').filter(Boolean)`.
- **D-11b (deletePhoto):** Same fix applied to the standalone deletePhoto function.
- `filter(Boolean)` handles empty segments from leading/trailing slashes. `new URL()` is robust to query parameters, ports, and other URL components.

**Commit:** `6ca6711` — fix: use URL constructor for photo storage path extraction

### Task 3: Static import + explicit column selection

**Files:** `taro-app/src/pages/index/index.tsx`, `shared/lib/trips.ts`, `taro-app/src/services/auth.ts`

- **D-12 (index.tsx):** Replaced `const { normalizeProvinceName } = require('@shared/lib/provinces')` inside the chart click handler callback with a static ES module import: `import { TOTAL_PROVINCES, normalizeProvinceName } from '@shared/lib/provinces'`. Removed the dynamic require() call entirely.
- **D-14 (trips.ts):** `getPhotosByTrip` now selects `'id, trip_id, file_url, description, taken_at, created_at'` (matching PhotoRow). `getTimelines` now selects `'id, couple_id, date, title, description, icon, type, created_at, updated_at'` (matching TimelineRow).
- **D-14 (auth.ts):** `getUser` now selects `'id, nickname, avatar_url'` instead of `select('*')`.

**Commit:** `85bc2de` — fix: static import for normalizeProvinceName + explicit column selection

## Deviations from Plan

None — plan executed exactly as written.

## Auth Gates

None.

## Known Stubs

None.

## Self-Check: PASSED

- `.in()` quoting: `typeof v === 'string'` found in supabase.ts
- Single Content-Type header: `contentType + '; base64'` found once in storage.ts
- URL parsing: `new URL` found 2 times in trips.ts; zero `urlParts[urlParts.length` instances remain
- Static import: `require(` count in index.tsx = 0; `normalizeProvinceName` imported on line 9
- Explicit columns: zero `select('*')` in trips.ts and auth.ts
- Build: `npx taro build --type weapp` compiled successfully
