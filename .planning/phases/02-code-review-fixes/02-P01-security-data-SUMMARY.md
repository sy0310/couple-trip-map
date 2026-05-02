---
phase: 02-code-review-fixes
plan: 01
subsystem: security + data-integrity
tags: [p01, security, data-integrity, credentials, crypto, n+1, upload-pipeline]
dependency_graph:
  requires: []
  provides: [secured-credentials, typed-adapter, crypto-randomness, batch-queries]
  affects: [auth, album-upload, trip-deletion, province-detail, city-detail]
tech-stack:
  added: []
  patterns: [env-var-injection, cryptographic-randomness, batch-queries, typed-interfaces]
key_files:
  created: []
  modified:
    - taro-app/src/services/supabase.ts
    - shared/lib/adapter.ts
    - taro-app/src/services/auth.ts
    - shared/lib/couples.ts
    - shared/lib/utils.ts
    - taro-app/src/pages/album/index.tsx
    - shared/lib/trips.ts
    - taro-app/packageProvince/pages/province/index.tsx
    - taro-app/packageCity/pages/city/index.tsx
decisions:
  - Used process.env.TARO_APP_SUPABASE_* for build-time credential injection
  - Used wx.getRandomValues() for cryptographic randomness (WeChat mini program compatible)
  - Added MAX_ATTEMPTS=5 retry limit for binding code generation
  - Batch queries return Map<string, number/string[]> for efficient lookups
  - Per-file error isolation in album upload with continue pattern
metrics:
  duration: ~15min
  completed: 2026-05-02
  tasks_completed: 5
  files_modified: 9
  commits: 6
---

# Phase 02 Plan 01: Security and Data Integrity Fixes Summary

Fix all 2 CRITICAL and 6 HIGH severity issues from the Phase 1 code review.

## One-liner

Eliminated hardcoded credentials, weak randomness, unsafe type casts, missing DB records in photo uploads, storage deletion order bugs, and N+1 queries.

## Tasks Completed

### Task 1: Credential Hardening + Adapter Interface + Secure Token Storage
**Commits:** 58e6008

- Replaced hardcoded `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `supabase.ts` with `process.env.TARO_APP_SUPABASE_URL` / `process.env.TARO_APP_SUPABASE_ANON_KEY`
- Added runtime check that logs error if env vars are missing
- Added `setToken(token: string): void` to `SupabaseAdapter` interface in `adapter.ts`
- Eliminated two unsafe `(adapter as unknown as { setToken }).setToken(token)` casts in `auth.ts`, now calls `adapter.setToken(token)` directly

### Task 2: Cryptographic Randomness
**Commits:** d833686

- `couples.ts` `generateBindingCode`: Replaced `Math.random()` with `wx.getRandomValues()`, converted recursive retry to bounded loop with `MAX_ATTEMPTS = 5`
- `utils.ts` `generateId`: Replaced `Math.random()` with `wx.getRandomValues()` using 16 random bytes for UUID v4 generation

### Task 3: Album Upload Pipeline Fix
**Commits:** f538c83, 756b335

- Upload path now uses `coupleId` prefix instead of `userId`
- Each successful upload creates a DB photo record via `createPhotoRecord()`
- Lazy-creates an "album" trip for photo records via `createTrip()`
- Per-file error isolation: try/catch per file with `continue` on failure
- Shows success count toast
- Fixed import: `getCoupleId` correctly imported from `@shared/lib/couples`

### Task 4: Storage-Aware Photo Deletion
**Commits:** ff1a3a6

- `deleteTrip`: Checks `storageResult.error` per photo, logs failures, continues with remaining photos
- `deletePhoto`: Returns `false` if storage `remove()` fails, does not proceed to DB delete (prevents orphaned DB records)

### Task 5: Province/City N+1 Query Fix
**Commits:** 2245d7a

- Added `getTripCountsByCities()` batch query function to `trips.ts` (returns `Map<string, number>`)
- Added `getPhotosByTripIds()` batch query function to `trips.ts` (returns `Map<string, string[]>`)
- Province page: replaced per-city `for-await` loop with single `getTripCountsByCities` call
- City page: replaced per-trip `for-await` loop with single `getPhotosByTripIds` call

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect getCoupleId import path**
- **Found during:** Task 3 (album upload)
- **Issue:** Album page imported `getCoupleId` from `@shared/lib/trips` but it is defined in `@shared/lib/couples`
- **Fix:** Split import into two lines: `getCoupleId` from `@shared/lib/couples`, rest from `@shared/lib/trips`
- **Files modified:** `taro-app/src/pages/album/index.tsx`
- **Commit:** 756b335

## All Commits

| Hash | Message |
|------|---------|
| 58e6008 | fix: extract Supabase credentials to env vars, add setToken to adapter interface, eliminate unsafe casts |
| d833686 | fix: use cryptographic randomness for binding codes and ID generation |
| f538c83 | fix: album upload creates DB records, uses coupleId path, isolates per-file errors |
| ff1a3a6 | fix: check storage deletion result before removing DB records |
| 2245d7a | fix: replace N+1 queries with batch fetches in province and city pages |
| 756b335 | fix: correct getCoupleId import path in album page to @shared/lib/couples |

## Build Verification

```
npx taro build --type weapp
Compiled successfully in 5.15s
```

## Verification Results

| Check | Result |
|-------|--------|
| No hardcoded Supabase credentials | PASSED |
| No Math.random in couples.ts/utils.ts | PASSED |
| No unsafe type casts in auth.ts | PASSED |
| SupabaseAdapter includes setToken | PASSED |
| Album creates photo DB records | PASSED |
| Per-file error isolation in upload | PASSED |
| Storage deletion results checked | PASSED |
| Province page uses batch query | PASSED |
| City page uses batch query | PASSED |

## Self-Check: PASSED

All verification checks pass. Build compiles successfully. All 6 commits are on the main branch.
