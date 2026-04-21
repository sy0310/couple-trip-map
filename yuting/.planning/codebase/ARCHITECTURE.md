# Architecture

**Analysis Date:** 2026-04-20

## Pattern Overview

**Overall:** Next.js App Router with browser-side Supabase client (no API routes)

**Key Characteristics:**
- All data access happens client-side via `@supabase/supabase-js`
- No server-side API routes or server actions — direct Supabase queries from components
- SSR-safe Supabase client via singleton pattern in `src/lib/supabase-browser.ts`
- Pages use `Suspense` boundaries for loading states
- Dynamic imports for client-only components (Leaflet, ECharts) to avoid SSR issues

## Layers

**Presentation Layer:**
- Location: `src/app/` (pages) + `src/components/` (UI components)
- Contains: Next.js App Router pages, React components
- Depends on: `@/lib/` for data access, `@/hooks/` for React hooks
- Used by: End users via browser

**Data Access Layer:**
- Location: `src/lib/trips.ts`, `src/lib/auth.ts`
- Contains: Supabase CRUD operations, auth helpers
- Depends on: `@/lib/supabase-browser.ts` for client, `@/lib/provinces.ts` for static data
- Used by: Page components and interactive components

**Static Data Layer:**
- Location: `src/lib/provinces.ts`
- Contains: Province/city names, coordinates, scenic spots, GeoJSON file mapping
- No external dependencies — pure TypeScript data

**Infrastructure Layer:**
- Location: `src/lib/supabase-browser.ts`, `src/middleware.ts`
- Contains: Supabase client factory, Next.js middleware for auth session refresh
- Used by: All data access functions

## Data Flow

**User Login Flow:**
1. User visits `/login` → enters email/password
2. Supabase Auth authenticates → redirects to `/auth/callback`
3. Callback exchanges code for session → redirects to `/`
4. Middleware refreshes session on every request via `supabase.auth.getUser()`

**Trip Creation Flow:**
1. User clicks "添加旅行" on `/province` or `/city` page
2. `AddTripForm` component renders with province/city pre-filled
3. On submit, `createTrip()` in `src/lib/trips.ts` checks for duplicates
4. Inserts new row into `trips` table via Supabase REST API
5. Page refreshes visited state (province/city counts)

**Province/Map Display Flow:**
1. `/province?name=北京` loads → fetches visited cities from `getVisitedCities()`
2. Fetches GeoJSON from `/public/geojson/bei_jing_geo.json`
3. Renders `CityMap` or `ProvinceMap` component with Leaflet/ECharts
4. Markers placed at visited city/spot coordinates

**State Management:**
- React `useState`/`useEffect` for local component state
- No global state library (Zustand, Redux, etc.) — all state is local or fetched from Supabase
- URL search params as state (`?name=`, `?province=`)

## Key Abstractions

**Province Data Model (`src/lib/provinces.ts`):**
- `PROVINCES` map — static data for all Chinese provinces with cities, coords, scenic spots
- `GEOJSON_TO_PROVINCE` — maps GeoJSON filename short names to display names
- `normalizeProvinceName()` — handles china.json full-name → short-name conversion
- `getGeoJsonFileName()` — resolves province name to GeoJSON filename

**Supabase Client (`src/lib/supabase-browser.ts`):**
- Singleton pattern — caches client instance to avoid re-creation
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars

**Map Components:**
- `LeafletMap` (`src/components/leaflet-map.tsx`) — Core Leaflet map with markers and GeoJSON boundary
- `ProvinceMap` (`src/components/province-map-leaflet.tsx`) — Province-level map with city markers
- `CityMap` (`src/components/city-map.tsx`) — City-level map with scenic spot markers
- All use `dynamic import` with `ssr: false` to avoid SSR issues

## Entry Points

**`/` (Home):**
- Location: `src/app/page.tsx`
- 3D room scene (`Room3D`) + visited provinces overview
- Entry point after login

**`/province?name=`:**
- Location: `src/app/province/page.tsx`
- Province detail: city list, progress bar, map
- Municipality provinces show city map directly

**`/city?name=&province=`:**
- Location: `src/app/city/page.tsx`
- City detail: scenic spot map, trip records

**`/album`:**
- Location: `src/app/album/page.tsx`
- Photo album grouped by year

**`/profile`:**
- Location: `src/app/profile/page.tsx`
- Couple binding, unbinding, profile info

## Error Handling

**Strategy:** Fail-soft with console logging — no user-facing error boundaries (except Suspense)

**Patterns:**
- Supabase errors logged via `console.error` in `src/lib/trips.ts`
- Failed queries return empty arrays `[]` rather than throwing
- `createTrip` returns `null` on failure

## Cross-Cutting Concerns

**Logging:** `console.error` for Supabase failures only
**Validation:** Minimal — relies on Supabase schema constraints
**Authentication:** Supabase Auth with SSR cookie refresh in middleware

---

*Architecture analysis: 2026-04-20*
