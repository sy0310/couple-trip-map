<!-- refreshed: 2026-04-26 -->
# Architecture

**Analysis Date:** 2026-04-26

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                             │
├───────────────────────────┬──────────────────────────────────────┤
│  WeChat Mini Program       │  Web App (Next.js 16)                │
│  `miniprogram/pages/`      │  `yuting/src/app/`                   │
│  Native WXML/WXSS/JS       │  React 19 + TypeScript + Tailwind v4 │
├─────────────┬─────────────┼─────────────┬────────────────────────┤
│ pages/index │ pages/album │ Home (3D)   │ Province / City / etc  │
│ pages/      │ pages/      │             │                        │
│  province   │  profile    │             │                        │
│ pages/city  │             │             │                        │
└──────┬──────┴─────────────┴──────┬──────┴────────────────────────┘
       │                           │
       ▼                           ▼
┌──────────────────┐    ┌──────────────────────────────────────────┐
│ WeChat Cloud      │    │  Supabase (PostgreSQL + Storage + Auth) │
│ cloudfunctions/   │    │  `yuting/src/lib/supabase-browser.ts`   │
│ - couple/         │    │  `yuting/src/lib/trips.ts`              │
│ - trip/           │    │  `yuting/src/lib/auth.ts`               │
│ - photo/          │    │  `yuting/src/lib/database.types.ts`     │
│ - login/          │    │                                        │
└──────────────────┘    └──────────────────────────────────────────┘
       │                           │
       ▼                           ▼
┌──────────────────┐    ┌──────────────────────────────────────────┐
│ WeChat Cloud DB   │    │  Supabase Storage (photos bucket)        │
│ Collections:      │    │  URL: /photos/{coupleId}/{uuid}.jpg      │
│ users, couples,   │    │                                        │
│ trips, locations, │    │                                        │
│ photos            │    │                                        │
└──────────────────┘    └──────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Home (3D Room)** | Central hub — 3D room scene with province/city/photo data | `yuting/src/app/page.tsx` |
| **Room 3D** | CSS-perspective 3D room visualization | `yuting/src/components/room-3d.tsx` |
| **Wood Relief Map** | Province-level map with visited city markers | `yuting/src/components/wood-relief-map.tsx` |
| **Wood Relief City Map** | City-level map with scenic spot markers | `yuting/src/components/wood-relief-city-map.tsx` |
| **City Leaflet Map** | Leaflet-based interactive map | `yuting/src/components/city-leaflet-map.tsx` |
| **Province Leaflet Map** | Leaflet-based province map | `yuting/src/components/province-leaflet-map.tsx` |
| **Add Trip Form** | Form to create new trip records | `yuting/src/components/add-trip-form.tsx` |
| **Edit Trip Form** | Form to edit existing trip records | `yuting/src/components/edit-trip-form.tsx` |
| **Bottom Nav** | Shared bottom navigation bar | `yuting/src/components/bottom-nav.tsx` |
| **Data Layer (trips)** | All trip/photo/couple CRUD operations | `yuting/src/lib/trips.ts` |
| **Auth Layer** | Supabase auth helpers and useAuth hook | `yuting/src/lib/auth.ts` |
| **Province Data** | Static province/city/spot data with coordinates | `yuting/src/lib/provinces.ts` |
| **Mini Program Index** | China map with visited provinces (stub) | `miniprogram/pages/index/index.js` |
| **Mini Program Province** | Province detail with city list | `miniprogram/pages/province/province.js` |
| **Mini Program City** | City detail with trips and photos | `miniprogram/pages/city/city.js` |
| **Mini Program Album** | Photo album grouped by year | `miniprogram/pages/album/album.js` |
| **Mini Program Profile** | Profile with couple bind/unbind | `miniprogram/pages/profile/profile.js` |
| **Cloud Function: couple** | Couple binding (create/join/check/unbind) | `cloudfunctions/couple/index.js` |
| **Cloud Function: trip** | Trip CRUD (add/list/update/delete) | `cloudfunctions/trip/index.js` |
| **Cloud Function: photo** | Photo CRUD (upload/list/delete) | `cloudfunctions/photo/index.js` |

## Pattern Overview

**Overall:** Dual-frontend architecture — WeChat Mini Program (cloud functions + WeChat Cloud DB) and Web App (Next.js 16 + Supabase)

**Key Characteristics:**
- Both frontends share the same data model (see `docs/database.md`) but use different backends
- Web app uses direct Supabase client calls from browser (no API middleware layer)
- Mini Program uses WeChat Cloud Functions as a serverless proxy to WeChat Cloud DB
- Static province/city/scenic spot data embedded in `yuting/src/lib/provinces.ts`
- All UI text is in Chinese
- Web app uses `'use client'` for all pages (client-side rendering)

## Layers

### WeChat Mini Program Frontend

- **Purpose:** Primary product — native WeChat experience
- **Location:** `miniprogram/`
- **Contains:** WXML templates, WXSS styles, Page JS files, app entry point
- **Depends on:** WeChat Cloud SDK (`wx.cloud`)
- **Used by:** WeChat users directly

### WeChat Cloud Functions (Backend)

- **Purpose:** Serverless API for mini program
- **Location:** `cloudfunctions/`
- **Contains:** Node.js cloud functions (`couple`, `trip`, `photo`, `login`)
- **Depends on:** WeChat Cloud DB, WeChat Cloud Storage
- **Used by:** Mini Program frontend via `wx.cloud.callFunction()`

### Web App Frontend

- **Purpose:** Web-accessible version with 3D room visualization
- **Location:** `yuting/src/`
- **Contains:** Next.js App Router pages, React components, Supabase data layer
- **Depends on:** Supabase (auth, DB, storage)
- **Used by:** Web users via browser

### Supabase Backend (Web App)

- **Purpose:** Database, file storage, and auth for web app
- **Location:** External service, accessed via `@supabase/supabase-js`
- **Contains:** PostgreSQL tables (`users`, `couples`, `trips`, `photos`), storage bucket (`photos`)
- **Depends on:** None (external managed service)
- **Used by:** Web app frontend via `yuting/src/lib/supabase-browser.ts`

## Data Flow

### Primary Request Path (Web App — View Province)

1. **Entry:** User navigates to `/province?name=广东` — `yuting/src/app/province/page.tsx`
2. **Auth check:** `getCoupleId()` called from `yuting/src/lib/trips.ts` — checks Supabase auth session
3. **Data fetch:** `getVisitedCities(coupleId, provinceName)` queries `trips` table via Supabase
4. **GeoJSON load:** Province boundary GeoJSON fetched from `/public/geojson/{province}_geo.json`
5. **Render:** `WoodReliefMap` component renders province with visited city markers
6. **Navigation:** Click city → `window.location.href = /city?name=广州&province=广东`

### Primary Request Path (Web App — Add Trip)

1. **Trigger:** Click "+ 添加旅行" → `AddTripForm` component opens
2. **Create trip:** `createTrip(coupleId, tripData)` in `yuting/src/lib/trips.ts` checks for duplicates, inserts into `trips` table
3. **Upload photos:** `uploadPhotosToTrip(tripId, coupleId, files)` uploads to Supabase Storage, creates `photos` records
4. **Real-time update:** Supabase Realtime channel (`trips` + `photos` tables) triggers data reload on all connected clients

### Mini Program Data Path (View Province)

1. **Entry:** User taps province on home map → `wx.navigateTo` to `pages/province/province`
2. **Cloud call:** `wx.cloud.callFunction({ name: 'trip/list', data: { province } })` → `cloudfunctions/trip/index.js`
3. **Couple check:** Cloud function checks user's couple relationship in `couples` collection
4. **Query:** If coupled, queries trips for both partners; otherwise just user's trips
5. **Return:** `{ success, data: { trips, total, page } }` response
6. **Render:** Province page displays visited cities with completion stats

### State Management (Web App)

- **No global state library** — all state is local React `useState` per page
- **Data loading:** Each page component fetches its own data via `useEffect` on mount
- **Real-time sync:** Pages subscribe to Supabase Realtime channels for live updates:
  - Home: `yuting/src/app/page.tsx` subscribes to `trips` table changes
  - Album: `yuting/src/app/album/page.tsx` subscribes to `trips` and `photos` table changes
- **Navigation:** Uses `window.location.href` for page transitions (not Next.js `useRouter` for cross-page nav)

### State Management (Mini Program)

- **App-level:** `App.globalData` in `miniprogram/app.js` holds `userInfo` and `coupleInfo`
- **Page-level:** Each page uses `this.setData()` to update local state
- **Persistence:** `wx.getStorageSync('userInfo')` for cached user data
- **No real-time sync** — pages refresh on `onShow` lifecycle

## Key Abstractions

### Supabase Client (Singleton)

- **Purpose:** Shared Supabase client instance
- **File:** `yuting/src/lib/supabase-browser.ts`
- **Pattern:** Lazy-initialized singleton — `createClient()` returns same instance across calls

### Data Layer (trips.ts)

- **Purpose:** All CRUD operations for trips, photos, and couple data
- **File:** `yuting/src/lib/trips.ts` (582 lines)
- **Exports:** `getCoupleId`, `getCoupleInfo`, `getVisitedProvinces`, `getVisitedCities`, `getVisitedCitiesWithCoords`, `getTripsByCity`, `createTrip`, `updateTrip`, `deleteTrip`, `uploadPhoto`, `createPhotoRecord`, `getPhotosByTrip`, `getAllPhotosForCouple`, `uploadPhotosToTrip`, `deletePhoto`, `generateBindingCode`, `acceptBindingCode`, `deleteCoupleBinding`

### Province Data (Static)

- **Purpose:** Province/city/scenic spot data with coordinates
- **File:** `yuting/src/lib/provinces.ts` (557 lines)
- **Pattern:** Static TypeScript array with helper functions (`getProvinceByName`, `normalizeProvinceName`, `getGeoJsonFileName`)
- **Contains:** 34 provinces with cities and scenic spots, each with lat/lng coordinates

### Database Types

- **Purpose:** TypeScript types for Supabase schema
- **File:** `yuting/src/lib/database.types.ts`
- **Tables:** `users`, `couples`, `trips`, `photos`

## Entry Points

### WeChat Mini Program

- **Location:** `miniprogram/app.js`
- **Triggers:** WeChat app launch
- **Responsibilities:** Initialize `wx.cloud`, set global data
- **Tab Bar:** 地图 (index), 相册 (album), 我的 (profile)

### Web App

- **Location:** `yuting/src/app/page.tsx` (home), `yuting/src/app/layout.tsx` (root layout)
- **Triggers:** Browser navigation
- **Responsibilities:** Load couple data, render 3D room, handle province/city navigation

### Cloud Functions

- **Location:** `cloudfunctions/{couple,trip,photo,login}/index.js`
- **Triggers:** `wx.cloud.callFunction()` from mini program
- **Pattern:** Single `exports.main` dispatcher with `action` switch per operation type

## Architectural Constraints

- **Threading:** Single-threaded — both mini program (JS engine) and web app (browser) run on event loops
- **Global state:** `miniprogram/app.js` has `App.globalData` singleton; web app has no global state module
- **Circular imports:** Not detected
- **Client-only rendering:** All web app pages use `'use client'` — no server-side data fetching or SSR
- **Navigation:** Web app uses `window.location.href` for navigation between pages (full page reload), not Next.js client-side routing
- **Realtime dependency:** Web app uses Supabase Realtime (PostgreSQL changes) for live data sync — requires Supabase project with Realtime enabled

## Anti-Patterns

### Client-Side Navigation via window.location.href

**What happens:** Web app pages use `window.location.href` for cross-page navigation (`yuting/src/app/page.tsx:68`, `yuting/src/app/province/page.tsx:96`, `yuting/src/app/city/page.tsx` back buttons)
**Why it's wrong:** Defeats Next.js client-side routing benefits — causes full page reload, loses app state, slower transitions
**Do this instead:** Use `useRouter` from `next/navigation` or `next/link` for client-side navigation

### All Pages Are Client Components

**What happens:** Every page in `yuting/src/app/` is `'use client'` — no server components, no SSR data fetching
**Why it's wrong:** Misses Next.js App Router benefits (SSR, streaming, SEO) — initial load requires full client-side fetch
**Do this instead:** Use Server Components for data fetching, pass data to client components as props

### Inline Data in Mini Program Pages

**What happens:** `miniprogram/pages/province/province.js:31-61` and `miniprogram/pages/city/city.js:38-73` contain hardcoded province/city data as fallback mocks
**Why it's wrong:** Data is duplicated and will diverge from `yuting/src/lib/provinces.ts`
**Do this instead:** Load province data from a shared source or cloud database

### N+1 Photo Queries in getVisitedCitiesWithCoords

**What happens:** `yuting/src/lib/trips.ts:256-259` loops through each trip and calls `getPhotosByTrip(tripId)` — one query per trip
**Why it's wrong:** Performance degrades linearly with trip count
**Do this instead:** Fetch all photos in a single query and group by `trip_id` client-side

## Error Handling

**Strategy:** Try-catch with user-friendly messages, console.error for logging

**Patterns:**
- Cloud functions: Return `{ success: false, message: '...' }` on error (`cloudfunctions/trip/index.js:90-94`)
- Web app: Functions return `null` or `false` on error, with `console.error` (`yuting/src/lib/trips.ts:356-358`)
- Mini Program: `success`/`fail` callbacks in `wx.cloud.callFunction` — fail silently to not break UI (`miniprogram/pages/province/province.js:101-103`)

## Cross-Cutting Concerns

**Logging:** `console.error` in cloud functions and web app data layer; no structured logging framework

**Validation:** Manual field validation in cloud functions (`cloudfunctions/trip/index.js:43-47`); form-level validation in web app forms

**Authentication:**
- Mini Program: WeChat openid via `wx.cloud.getWXContext()` — automatic
- Web App: Supabase Auth (email/password) — `yuting/src/lib/auth.ts` with `useAuth` hook
- Both: All data operations scoped to couple — users must be in a couple relationship to see shared data

---

*Architecture analysis: 2026-04-26*
