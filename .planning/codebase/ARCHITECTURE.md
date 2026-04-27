<!-- refreshed: 2026-04-27 -->
# Architecture

**Analysis Date:** 2026-04-27

## System Overview

The project is a **dual-frontend architecture** serving the same product (遇亭 — a couple's travel map) across two platforms:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT FRONTENDS                                │
├─────────────────────────────────────┬───────────────────────────────────┤
│    WeChat Mini Program (Primary)    │       Web App (yuting/)           │
│    `miniprogram/`                    │       Next.js 16 + React 19       │
│    Native WXML/WXSS/JS              │       SSR + Client Components     │
│    wx.cloud.init() entry            │       /src/app/page.tsx           │
├────────────────┬────────────────────┼──────────────────┬────────────────┤
│  Index Page    │ Province Page      │  Room3D Home     │ Auth/Profile   │
│  `pages/index` │ `pages/province`   │  `app/page.tsx`  │ `app/profile`  │
│  Album Page    │ City Page          │  Album Page      │ City Page      │
│  `pages/album` │ `pages/city`       │  `app/album`     │ `app/city`     │
│  Profile Page  │                    │  `app/profile`   │ Province Page  │
│  `pages/profile`│                   │  `app/province`  │                │
└───────┬─────────────────┬──────────┴────────┬─────────┴────────────────┘
        │                 │                   │
        ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVER / BACKEND                                 │
├─────────────────────────────────────┬───────────────────────────────────┤
│    WeChat Cloud Functions            │       Supabase (PostgreSQL)       │
│    `cloudfunctions/`                 │       `yuting/src/lib/`           │
│    Node.js serverless               │       supabase-browser.ts         │
├──────────────┬──────────────────────┼──────────────────┬────────────────┤
│  couple/     │  trip/               │  trips.ts (repo) │  auth.ts       │
│  bind/unbind │  CRUD trips          │  CRUD + photos   │  Supabase Auth │
│  photo/      │  login/ (stub)       │  provinces.ts    │  middleware.ts │
│  upload/list │  (README only)       │  geojson-to-svg  │                │
└──────────────┴──────────────────────┴──────────────────┴────────────────┘
        │                                                    │
        ▼                                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA STORAGE                                      │
├─────────────────────────────────────┬───────────────────────────────────┤
│    WeChat Cloud DB                   │       Supabase DB (PostgreSQL)    │
│    Collections: users, couples,      │       Tables: users, couples,     │
│    trips, locations, photos          │       trips, photos               │
│    + Cloud Storage (files)           │       + Supabase Storage (files)  │
└─────────────────────────────────────┴───────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` (Mini Program) | Cloud init with placeholder env ID, globalData for userInfo/coupleInfo | `miniprogram/app.js` |
| `IndexPage` (MP) | Home map with visited provinces (currently mock data) | `miniprogram/pages/index/index.js` |
| `ProvincePage` (MP) | Province detail with city list and progress | `miniprogram/pages/province/province.js` |
| `CityPage` (MP) | City detail with spot list and trip records | `miniprogram/pages/city/city.js` |
| `AlbumPage` (MP) | Photo album timeline view | `miniprogram/pages/album/album.js` |
| `ProfilePage` (MP) | Couple bind/unbind | `miniprogram/pages/profile/profile.js` |
| `HomePage` (Web) | 3D room home with WoodMap, photo frames, diary section | `yuting/src/app/page.tsx` |
| `Room3D` | 3D room layout — wood map, photo frames, journal card | `yuting/src/components/room-3d.tsx` |
| `WoodMap` | SVG province map with visited highlighting + city markers | `yuting/src/components/wood-map.tsx` |
| `WoodReliefMap` | Province-level relief map with city markers | `yuting/src/components/wood-relief-map.tsx` |
| `WoodReliefCityMap` | City-level relief map with scenic spot markers | `yuting/src/components/wood-relief-city-map.tsx` |
| `BottomNav` | Fixed bottom navigation (地图/相册/我的) with wood-grain styling | `yuting/src/components/bottom-nav.tsx` |
| `AddTripForm` | Modal form for creating trips with photo upload | `yuting/src/components/add-trip-form.tsx` |
| `EditTripForm` | Modal form for editing existing trips | `yuting/src/components/edit-trip-form.tsx` |
| `RoomPanel` | Wooden wall panel container for sections | `yuting/src/components/furniture.tsx` |
| `PhotoPickerModal` | Photo selection modal in Room3D | `yuting/src/components/room-3d.tsx:29-101` |
| `useSvgZoom` | SVG zoom/pan hook (mouse wheel + drag + touch pinch) | `yuting/src/hooks/use-svg-zoom.ts` |
| `trips.ts` | Data layer: all trip/photo/couple operations via Supabase | `yuting/src/lib/trips.ts` |
| `auth.ts` | Supabase Auth wrapper + useAuth hook | `yuting/src/lib/auth.ts` |
| `supabase-browser.ts` | Singleton Supabase client factory | `yuting/src/lib/supabase-browser.ts` |
| `provinces.ts` | Province/city/spot coordinate data (34 provinces) + GeoJSON mapping | `yuting/src/lib/provinces.ts` |
| `geojson-to-svg.ts` | GeoJSON to SVG path conversion with Douglas-Peucker simplification | `yuting/src/lib/geojson-to-svg.ts` |
| `couple` (cloud fn) | Couple binding: create (8-char code), join, check, unbind | `cloudfunctions/couple/index.js` |
| `trip` (cloud fn) | Trip CRUD: add, list (with pagination), update, delete | `cloudfunctions/trip/index.js` |
| `photo` (cloud fn) | Photo upload, list (with pagination), delete from cloud storage | `cloudfunctions/photo/index.js` |
| `login` (cloud fn) | User login (stub — README only, no implementation) | `cloudfunctions/login/` |

## Pattern Overview

**Overall:** Dual-platform with shared data model, separate backends

**Key Characteristics:**
- Mini program uses WeChat Cloud Development (serverless functions + cloud DB)
- Web app uses Supabase (PostgreSQL + Auth + Storage) as BaaS
- Both platforms share the same conceptual data model (users, couples, trips, photos)
- Web app uses real-time Supabase subscriptions for live updates on Home and Album pages
- Navigation is multi-level drill-down: Map -> Province -> City -> Spot
- All UI text is in Chinese
- Web app uses a dark wood-themed design language (browns, warm golds)
- Web app uses `'use client'` on all pages — no server components for data fetching

## Layers

**Frontend Layer (WeChat Mini Program):**
- Purpose: Native WeChat experience, primary product
- Location: `miniprogram/`
- Contains: Pages (WXML/WXSS/JS), global app config, tab bar icons
- Depends on: WeChat Cloud SDK (`wx.cloud`), WeChat base library 2.19.4+
- Used by: WeChat users directly

**Frontend Layer (Web App):**
- Purpose: Cross-platform web access, 3D room visualization, PWA support
- Location: `yuting/src/`
- Contains: Next.js App Router pages, React components, hooks, lib utilities
- Depends on: Supabase JS SDK, Next.js 16, React 19, Tailwind CSS v4, Turbopack
- Used by: Web/PWA users

**Backend Layer (WeChat Cloud):**
- Purpose: Serverless business logic for mini program
- Location: `cloudfunctions/`
- Contains: 4 cloud functions (couple, trip, photo, login) — each with `index.js` + `package.json`
- Depends on: `wx-server-sdk`, WeChat Cloud DB, WeChat Cloud Storage
- Used by: Mini program frontend via `wx.cloud.callFunction()`

**Backend Layer (Supabase):**
- Purpose: BaaS for web app — DB, Auth, Storage, Realtime
- Location: `yuting/src/lib/` (client-side only, no API routes)
- Contains: Supabase client singleton, auth helpers, data repository functions in `trips.ts`
- Depends on: `@supabase/supabase-js`, `@supabase/ssr`
- Used by: Web app React components directly (client-side queries with anon key)

**Data Layer:**
- Purpose: Persistent storage for both platforms
- Location: WeChat Cloud DB + Supabase PostgreSQL
- Contains: 4-5 collections/tables — `users`, `couples`, `trips`, `photos` (+ `locations` in MP)
- Web app uses Supabase Storage bucket `photos` with path `{coupleId}/{uuid}.{ext}`

## Data Flow

### Primary Request Path (Web App — Add Trip)

1. User fills `AddTripForm` modal (`yuting/src/components/add-trip-form.tsx:49`)
2. Form calls `createTrip()` in `trips.ts` which queries Supabase for duplicates (same couple + province + city + date), then inserts
3. Photos uploaded sequentially via `uploadPhoto()` to Supabase Storage, then `createPhotoRecord()` inserts DB row per photo
4. Supabase Realtime channel fires `postgres_changes` event on `trips` and `photos` tables
5. `AlbumPage` or `HomePage` subscription triggers `loadTrips()`/`loadData()` refresh

### Province Drill-Down Path (Web App)

1. `HomePage` renders `Room3D` with `WoodMap` component (`yuting/src/app/page.tsx:60`)
2. User clicks province -> `onProvinceClick` navigates via `window.location.href` to `/province?name=广东`
3. `ProvincePage` (wrapped in `Suspense`) fetches coupleId, visited cities, and GeoJSON for the province
4. For municipalities (北京/上海/天津/重庆): renders `WoodReliefCityMap` with scenic spot markers
5. For other provinces: renders `WoodReliefMap` with city markers + city list panel
6. User clicks city -> navigates to `/city?name=广州&province=广东`
7. `CityPage` fetches trip records and photos for that city, renders `WoodReliefCityMap` + trip record list

### Mini Program Navigation Path

1. `IndexPage` loads province data (currently has hardcoded mock data with TODO)
2. User taps province -> `onProvinceTap` navigates to `/pages/province/province?name=广东`
3. Province page shows city list with visit stats and progress bars
4. User taps city -> navigates to `/pages/city/city?name=广州&province=广东`
5. City page shows spot list, trip records, photo wall

### State Management

**Mini Program:**
- `app.js` `globalData` holds `userInfo` and `coupleInfo` (shared across pages)
- Each page uses `Page({ data: {} })` for local state
- `setData()` for reactive updates
- `wx.getStorageSync()` for local persistence

**Web App:**
- React `useState` + `useEffect` for component-local state
- `useAuth()` hook wraps Supabase auth state (`yuting/src/lib/auth.ts:53`)
- Supabase Realtime subscriptions for live data sync:
  - Home: `yuting/src/app/page.tsx:42-53` subscribes to `trips` table changes for the couple
  - Album: `yuting/src/app/album/page.tsx:84-101` subscribes to both `trips` and `photos` table changes
- No global state library — each page manages its own data fetching
- `createClient()` in `supabase-browser.ts` returns a singleton client via module closure

**Client/Server Boundary:**
- Mini program: Cloud functions act as server-side logic. Frontend calls `wx.cloud.callFunction()` with `{ action, ...params }`. Functions authenticate via `wxContext.OPENID`.
- Web app: No server-side API routes. All Supabase queries run client-side using the anon key. Access control relies on Supabase Row-Level Security (RLS) policies. Middleware (`yuting/src/middleware.ts`) refreshes auth cookies on each request.

## Key Abstractions

**Supabase Client (Singleton):**
- Purpose: Shared Supabase client instance
- File: `yuting/src/lib/supabase-browser.ts`
- Pattern: Lazy-initialized singleton — `createClient()` returns same instance across calls

**Data Layer (trips.ts):**
- Purpose: All CRUD operations for trips, photos, and couple data
- File: `yuting/src/lib/trips.ts` (582 lines)
- Exports: 18 functions covering couple binding, trip CRUD, photo management, and visited location queries

**Province Data (Static):**
- Purpose: Province/city/scenic spot data with coordinates and GeoJSON file mapping
- File: `yuting/src/lib/provinces.ts` (557 lines)
- Contains: 34 provinces with cities and scenic spots, each with lat/lng coordinates
- Helpers: `getProvinceByName`, `normalizeProvinceName`, `getGeoJsonFileName`, `provinceToGeoJsonName`, `getCityByName`

**GeoJSON to SVG Converter:**
- Purpose: Convert GeoJSON FeatureCollection to SVG path `d` strings
- File: `yuting/src/lib/geojson-to-svg.ts`
- Features: Douglas-Peucker line simplification, automatic bounding box calculation, Polygon and MultiPolygon support

## Entry Points

**WeChat Mini Program:**
- Location: `miniprogram/app.js`
- Triggers: WeChat app launch
- Responsibilities: Initialize `wx.cloud` with env ID (placeholder `your-env-id`), set globalData
- Tab Bar: 地图 (index), 相册 (album), 我的 (profile) — configured in `miniprogram/app.json`

**Web App:**
- Location: `yuting/src/app/layout.tsx` (root layout), `yuting/src/app/page.tsx` (home)
- Triggers: Browser request to Next.js server
- Responsibilities: Render HTML shell with 4 font families (Geist, Geist Mono, Newsreader, Manrope), SVG filters for wood texture, PWA metadata

**Middleware:**
- Location: `yuting/src/middleware.ts`
- Purpose: Supabase SSR cookie handling — creates server client, calls `getUser()` to refresh session, propagates cookies to response

**Cloud Functions:**
- Location: `cloudfunctions/{couple,trip,photo,login}/index.js`
- Triggers: `wx.cloud.callFunction()` from mini program
- Pattern: Single `exports.main` dispatcher with `action` switch per operation type

## Architectural Constraints

- **Threading:** Single-threaded event loop (Node.js/JavaScript). No worker threads used.
- **Global state:** `app.js` `globalData` singleton in mini program; Supabase client singleton via module closure in `supabase-browser.ts`.
- **Circular imports:** None detected — `lib/` has no imports from `components/` or `app/`, and component imports flow one direction.
- **Client-only rendering:** All web app pages use `'use client'` — no server components for data fetching.
- **Navigation via full page reload:** Web app uses `window.location.href` for cross-page navigation, not Next.js client-side routing.

## Anti-Patterns

### Client-Side Navigation via window.location.href

**What happens:** Web app pages use `window.location.href` for cross-page navigation (`yuting/src/app/page.tsx:68`, `yuting/src/app/province/page.tsx:96`, back buttons in province/city pages)
**Why it's wrong:** Defeats Next.js client-side routing benefits — causes full page reload, loses app state, slower transitions
**Do this instead:** Use `useRouter` from `next/navigation` or `next/link` for client-side navigation

### All Pages Are Client Components

**What happens:** Every page in `yuting/src/app/` is `'use client'` — no server components, no SSR data fetching
**Why it's wrong:** Misses Next.js App Router benefits (SSR, streaming, SEO) — initial load requires full client-side fetch
**Do this instead:** Use Server Components for data fetching, pass data to client components as props

### Inconsistent Data Schema Between Platforms

**What happens:** The WeChat cloud DB uses `partner1_openid`/`partner2_openid` fields in `couples`, while Supabase uses `user_a_id`/`user_b_id`. The cloud `trip` function stores `creator_openid`, while Supabase stores `couple_id` directly.
**Why it's wrong:** Makes it harder to sync data between platforms or migrate. Requires maintaining two different data models.
**Do this instead:** Align field names across both backends, or implement a sync layer.

### N+1 Photo Queries in getVisitedCitiesWithCoords

**What happens:** `yuting/src/lib/trips.ts:256-259` loops through each trip and calls `getPhotosByTrip(tripId)` — one query per trip
**Why it's wrong:** Performance degrades linearly with trip count
**Do this instead:** Fetch all photos in a single query and group by `trip_id` client-side

### Mini Program Index Page Uses Mock Data

**What happens:** `miniprogram/pages/index/index.js:17-29` has hardcoded mock province data with a TODO comment. The cloud function for listing trips exists but is not wired to the page.
**Why it's wrong:** The primary entry page shows fake data in production.
**Do this instead:** Call `wx.cloud.callFunction` to fetch real visited provinces from the cloud DB.

## Error Handling

**Strategy:** Try-catch in cloud functions with generic error messages; console.error + return null/false in web app data layer

**Patterns:**
- Cloud functions return `{ success: boolean, message: string, data? }` envelope (`cloudfunctions/couple/index.js:25-29`)
- Web app data functions return `null`, `false`, or `[]` on error with `console.error` (`yuting/src/lib/trips.ts:187-189`)
- UI components check for null/empty states and render appropriate empty UI (e.g., "还没有照片" in album page)

## Cross-Cutting Concerns

**Logging:** `console.log`/`console.error` in cloud functions and web app data layer. No structured logging framework.

**Validation:** Form-level validation in `AddTripForm` (required province/city/date checked before submit). Manual field validation in cloud functions (`cloudfunctions/trip/index.js:43-47`). No schema-based validation library (no Zod).

**Authentication:**
- Mini Program: WeChat openid via `wx.cloud.getWXContext().OPENID` — automatic, no explicit login
- Web App: Supabase Auth (email/password) with `useAuth()` hook and middleware-based session refresh
- Both: All data operations scoped to couple — users must be in a couple relationship to see shared data

---

*Architecture analysis: 2026-04-27*
