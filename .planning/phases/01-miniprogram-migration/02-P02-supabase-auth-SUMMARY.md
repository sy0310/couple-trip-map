---
plan: P02-supabase-auth
phase: 01-miniprogram-migration
status: complete
---

# P02 Supabase Auth — Summary

## What Was Built

Complete data layer for the Taro mini program: PostgREST query adapter using wx.request, shared business logic extracted from yuting/src/lib/trips.ts (with N+1 query fix), Supabase Storage adapter with wx.uploadFile and compression, WeChat login flow mapping openid to Supabase JWT, and React Context providing adapter + auth state to all pages.

## Key Files Created

- `taro-app/src/services/supabase.ts` — MiniSupabaseAdapter with PostgrestQueryBuilder (full QueryBuilder: select, eq, is, or, not(3-param), in, order, insert, update, delete, maybeSingle, thenable)
- `taro-app/src/services/storage.ts` — MiniStorageClient with wx.uploadFile + base64 fallback, compressImage utility
- `taro-app/src/services/auth.ts` — WeChat login flow: loginWithWeChat, ensureAuth, getToken, getUserId, getUser, logout, refreshToken
- `taro-app/src/app.tsx` — AppContext providing { adapter, userId, loading } to all pages
- `shared/lib/trips.ts` — Platform-agnostic trip business logic (adapter parameter, no browser/wx APIs, N+1 fix)
- `shared/lib/couples.ts` — Couple binding logic (generateBindingCode, acceptBindingCode, etc.)
- `shared/lib/utils.ts` — generateId() UUID v4 equivalent, UploadFile type
- `yuting/src/lib/supabase-adapter.ts` — WebSupabaseAdapter wrapping @supabase/supabase-js

## Key Decisions

- PostgrestQueryBuilder uses token getter function `() => this.token` to always read current token
- Auth stores token expiry with 5-minute early refresh window
- WebSupabaseAdapter wraps supabase-js client's from()/storage/rpc() directly

## Deviations

- Minor: auth.ts uses `() => this.token` getter pattern matching supabase.ts's PostgrestQueryBuilder design, rather than setToken on cast adapter

## Self-Check: PASSED

- All 5 tasks completed with atomic commits
- All acceptance_criteria from plan verified
- shared/lib/trips.ts has 0 references to createClient, supabase-browser, or wx.*
- AppContext defined and provided in app.tsx
