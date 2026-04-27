# Codebase Structure

**Analysis Date:** 2026-04-27

## Directory Layout

```
couple-trip-map/
├── miniprogram/              # WeChat Mini Program frontend
│   ├── app.js                # App entry: wx.cloud.init()
│   ├── app.json              # Page routes, tabBar config
│   ├── app.wxss              # Global styles
│   ├── images/               # Tab bar icons (map, album, profile active/inactive)
│   └── pages/
│       ├── index/            # Home: China map with visited provinces
│       │   ├── index.js      # Page logic (mock data -- needs cloud wiring)
│       │   ├── index.wxml    # Template
│       │   └── index.wxss    # Styles
│       ├── province/         # Province detail: city list, visit stats
│       │   ├── province.js
│       │   ├── province.wxml
│       │   └── province.wxss
│       ├── city/             # City detail: attractions, trips, photos
│       │   ├── city.js
│       │   ├── city.wxml
│       │   └── city.wxss
│       ├── album/            # Photo album: year-grouped timeline
│       │   ├── album.js
│       │   ├── album.wxml
│       │   └── album.wxss
│       └── profile/          # Profile: couple bind/unbind
│           ├── profile.js
│           ├── profile.wxml
│           └── profile.wxss
│
├── cloudfunctions/           # WeChat Cloud serverless functions
│   ├── couple/               # Couple binding CRUD
│   │   ├── index.js          # 282 lines: bind (create/join), check, unbind
│   │   └── package.json      # wx-server-sdk dependency
│   ├── trip/                 # Trip CRUD
│   │   ├── index.js          # 277 lines: add, list (paginated), update, delete
│   │   └── package.json
│   ├── photo/                # Photo upload/query/delete
│   │   ├── index.js          # 226 lines: upload, list (paginated), delete
│   │   └── package.json
│   └── login/                # User login (README only, no index.js)
│       └── README.md         # Example login code
│
├── yuting/                   # Next.js 16 Web App
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── layout.tsx    # Root layout: 4 fonts, SVG wood-grain filters, PWA meta
│   │   │   ├── page.tsx      # Home: 3D room scene with WoodMap
│   │   │   ├── globals.css   # Global Tailwind v4 styles
│   │   │   ├── global.d.ts   # Global TypeScript declarations
│   │   │   ├── middleware.ts # Supabase SSR cookie handling
│   │   │   ├── login/        # Login/register page
│   │   │   │   └── page.tsx
│   │   │   ├── auth/callback/# Supabase OAuth callback
│   │   │   │   └── page.tsx
│   │   │   ├── province/     # Province detail (query: ?name=)
│   │   │   │   └── page.tsx
│   │   │   ├── city/         # City detail (query: ?name=&province=&spot=)
│   │   │   │   └── page.tsx
│   │   │   ├── album/        # Photo album with year filter
│   │   │   │   └── page.tsx
│   │   │   └── profile/      # Profile/settings with couple binding
│   │   │       └── page.tsx
│   │   ├── components/       # React components (all 'use client')
│   │   │   ├── room-3d.tsx       # 3D room visualization with photo frames
│   │   │   ├── furniture.tsx     # RoomPanel wooden wall panel container
│   │   │   ├── texture.tsx       # Texture/wallpaper overlay components
│   │   │   ├── wood-map.tsx      # SVG-based wood-style province map
│   │   │   ├── wood-relief-map.tsx        # Province relief map with cities
│   │   │   ├── wood-relief-city-map.tsx   # City relief map with scenic spots
│   │   │   ├── province-map.tsx           # Province map wrapper
│   │   │   ├── province-leaflet-map.tsx   # Leaflet-based province map
│   │   │   ├── province-map-leaflet.tsx
│   │   │   ├── province-map-leaflet-inner.tsx
│   │   │   ├── city-map.tsx               # City map wrapper
│   │   │   ├── city-leaflet-map.tsx       # Leaflet-based city map
│   │   │   ├── leaflet-map.tsx            # Base Leaflet map component
│   │   │   ├── seal-marker.tsx            # Stamp-style map markers
│   │   │   ├── svg-compass.tsx            # Compass decoration
│   │   │   ├── warm-dust-particles.tsx    # Particle effect overlay
│   │   │   ├── loading-screen.tsx         # Loading overlay
│   │   │   ├── bottom-nav.tsx             # Fixed bottom nav (3 items)
│   │   │   ├── add-trip-form.tsx          # Trip creation modal form
│   │   │   └── edit-trip-form.tsx         # Trip editing modal form
│   │   ├── hooks/            # Custom React hooks
│   │   │   └── use-svg-zoom.ts  # SVG zoom/pan (mouse + touch pinch)
│   │   └── lib/              # Data layer and utilities
│   │       ├── supabase-browser.ts  # Supabase client singleton
│   │       ├── database.types.ts    # Generated TypeScript types
│   │       ├── trips.ts             # All CRUD operations (582 lines)
│   │       ├── auth.ts              # Auth functions + useAuth hook
│   │       ├── provinces.ts         # Static province/city data (557 lines)
│   │       └── geojson-to-svg.ts    # GeoJSON -> SVG path converter
│   ├── public/               # Static assets served by Next.js
│   │   ├── geojson/          # 34 province boundary GeoJSON files
│   │   │   ├── bei_jing_geo.json
│   │   │   ├── shang_hai_geo.json
│   │   │   ├── guang_dong_geo.json
│   │   │   └── ... (31 more)
│   │   └── icons/            # PWA app icons
│   ├── tests/                # E2E tests
│   │   └── e2e/              # Playwright test files
│   ├── .env.local            # Supabase URL + anon key (gitignored)
│   └── package.json          # Dependencies and scripts
│
├── docs/                     # Documentation
│   ├── database.md           # Database schema design
│   └── QUICKSTART.md         # Getting started guide
│
├── deploy.sh                 # Deploy script (mini program push)
├── project.config.json       # WeChat DevTools project config
└── CLAUDE.md                 # Project instructions for Claude
```

## Directory Purposes

### `miniprogram/` -- WeChat Mini Program Frontend

- **Purpose:** Primary product -- native WeChat mini program
- **Contains:** WXML templates, WXSS styles, Page JS files, app entry point, tab bar icons
- **Key files:**
  - `miniprogram/app.js` -- Cloud initialization with `your-env-id` placeholder, globalData
  - `miniprogram/app.json` -- Page routes (5 pages), tabBar config (3 tabs: 地图/相册/我的)
  - `miniprogram/app.wxss` -- Global shared styles (pink `#FF6B81` theme)

### `miniprogram/pages/` -- Mini Program Pages

- **Purpose:** One directory per page, following WeChat convention (`.js`, `.wxml`, `.wxss` triplet)
- **Contains:**
  - `index/` -- Home page: China map with visited provinces (light-up effect)
  - `province/` -- Province detail: city list, visit stats, progress bars
  - `city/` -- City detail: attraction list, trip records, photo wall
  - `album/` -- Photo album: year-grouped timeline view
  - `profile/` -- Profile: couple bind/unbind, user info

### `cloudfunctions/` -- WeChat Cloud Serverless

- **Purpose:** Backend API for mini program (Node.js serverless)
- **Contains:** Each function is a directory with `index.js` and `package.json`
- **Key files:**
  - `cloudfunctions/couple/index.js` -- Couple binding: `bind` (create with 8-char code / join), `check`, `unbind`
  - `cloudfunctions/trip/index.js` -- Trip CRUD: `add`, `list` (with pagination), `update`, `delete`
  - `cloudfunctions/photo/index.js` -- Photo: `upload` (to cloud storage), `list` (paginated), `delete`
  - `cloudfunctions/login/` -- Login function (README with example code, no `index.js` committed)

### `yuting/` -- Next.js Web App

- **Purpose:** Web version with 3D room visualization, Supabase backend, PWA support
- **Contains:** Full Next.js 16 project with App Router, Tailwind CSS v4, TypeScript, Turbopack

### `yuting/src/app/` -- App Router Pages

- **Purpose:** File-based routing -- each directory with `page.tsx` maps to a route
- **Route mapping:**
  - `/` -> `yuting/src/app/page.tsx` -- Home (3D room scene with WoodMap + photo frames + journal)
  - `/login` -> `yuting/src/app/login/page.tsx` -- Login/register page
  - `/auth/callback` -> `yuting/src/app/auth/callback/page.tsx` -- Supabase OAuth callback handler
  - `/province` -> `yuting/src/app/province/page.tsx` -- Province detail (query params: `?name=`)
  - `/city` -> `yuting/src/app/city/page.tsx` -- City detail (query params: `?name=&province=&spot=`)
  - `/album` -> `yuting/src/app/album/page.tsx` -- Photo album with year filter
  - `/profile` -> `yuting/src/app/profile/page.tsx` -- Profile/settings/couple binding

### `yuting/src/components/` -- React Components

- **Purpose:** Shared UI components, all using `'use client'` directive
- **Categorized by function:**
  - **3D Room:** `room-3d.tsx`, `furniture.tsx` (RoomPanel), `texture.tsx`
  - **Map Components:** `wood-map.tsx`, `wood-relief-map.tsx`, `wood-relief-city-map.tsx`, `province-map.tsx`, `city-map.tsx`, `leaflet-map.tsx`, `province-leaflet-map.tsx`, `city-leaflet-map.tsx`
  - **Decorations:** `seal-marker.tsx`, `svg-compass.tsx`, `warm-dust-particles.tsx`
  - **Forms:** `add-trip-form.tsx`, `edit-trip-form.tsx`
  - **Navigation:** `bottom-nav.tsx`
  - **UI:** `loading-screen.tsx`

### `yuting/src/lib/` -- Data Layer and Utilities

- **Purpose:** All data operations, auth, static data, and GeoJSON conversion
- **Key files:**
  - `supabase-browser.ts` -- Supabase client singleton (browser)
  - `database.types.ts` -- Generated TypeScript types for Supabase schema (4 tables)
  - `trips.ts` -- All CRUD operations: trips, photos, couples (582 lines, 18 exported functions)
  - `auth.ts` -- Auth functions (`signInWithPassword`, `signUp`, `signOut`) + `useAuth` hook
  - `provinces.ts` -- Static province/city/scenic spot data (557 lines, 34 provinces)
  - `geojson-to-svg.ts` -- GeoJSON to SVG path conversion with Douglas-Peucker simplification

### `yuting/src/hooks/` -- Custom React Hooks

- **Purpose:** Reusable hook logic
- **Key files:**
  - `use-svg-zoom.ts` -- SVG zoom/pan interaction hook (mouse wheel, drag, touch pinch)

### `yuting/public/` -- Static Assets

- **Purpose:** Served directly by Next.js
- **Key files:**
  - `geojson/` -- Province boundary GeoJSON files (34 files, one per province)
  - `icons/` -- PWA app icons
  - `manifest.json` -- PWA web app manifest

## Key File Locations

### Entry Points

- `miniprogram/app.js` -- WeChat Mini Program entry (cloud init, global data)
- `yuting/src/app/layout.tsx` -- Web App root layout (4 fonts, SVG texture filters, PWA meta)
- `yuting/src/app/page.tsx` -- Web App home page (3D room with WoodMap)
- `yuting/src/middleware.ts` -- Supabase SSR cookie middleware (refreshes auth on each request)

### Configuration

- `miniprogram/app.json` -- Mini program page routes, tabBar, window settings (pink `#FF6B81` nav bar)
- `project.config.json` -- WeChat DevTools project config (miniprogramRoot, cloudfunctionRoot, libVersion 2.19.4)
- `yuting/package.json` -- Web app dependencies and scripts (dev, build, lint, start, test:e2e)
- `yuting/.env.local` -- Supabase URL and anon key (gitignored)

### Core Logic

- `cloudfunctions/trip/index.js` -- Trip CRUD for mini program (add, list with pagination, update, delete)
- `cloudfunctions/couple/index.js` -- Couple binding for mini program (create 8-char code, join, check, unbind)
- `cloudfunctions/photo/index.js` -- Photo operations for mini program (upload, list with pagination, delete)
- `yuting/src/lib/trips.ts` -- All data operations for web app (trip CRUD, photo management, couple binding)
- `yuting/src/lib/auth.ts` -- Auth for web app (email/password sign-in/sign-up, useAuth hook)
- `yuting/src/lib/provinces.ts` -- Static province/city data with GeoJSON file mapping

### Testing

- `yuting/tests/e2e/` -- Playwright E2E test files
- `yuting/package.json` -- `test:e2e` script runs Playwright

## Naming Conventions

### Files

- **Mini Program:** `{page-name}/{page-name}.js|wxml|wxss` -- page directory matches page name
- **Web App Components:** kebab-case for filenames (`room-3d.tsx`, `bottom-nav.tsx`, `wood-relief-map.tsx`)
- **Web App Pages:** directory name maps to route (`province/page.tsx` -> `/province`)
- **Web App Lib/Utils:** kebab-case (`supabase-browser.ts`, `geojson-to-svg.ts`)
- **GeoJSON files:** `{pinyin_name}_geo.json` (e.g., `guang_dong_geo.json`, `shan_xi_1_geo.json`, `shan_xi_2_geo.json`)

### Components

- React components use PascalCase internally (`Room3D`, `BottomNav`, `WoodReliefMap`)
- Exported as named default exports from individual `.tsx` files

### Directories

- App Router route directories use lowercase (`province/`, `city/`, `album/`, `profile/`)

## Where to Add New Code

### New Page (Web App)

- **Implementation:** `yuting/src/app/{route-name}/page.tsx`
- **Components (if new):** `yuting/src/components/{component-name}.tsx`
- **Data functions (if new):** `yuting/src/lib/trips.ts` or new file in `yuting/src/lib/`

### New Page (Mini Program)

- **Implementation:** `miniprogram/pages/{page-name}/` directory with `.js`, `.wxml`, `.wxss` files
- **Register route:** Add to `miniprogram/app.json` -> `pages` array
- **Cloud function (if new):** `cloudfunctions/{function-name}/index.js` + `package.json`

### New Utility/Helper

- **Shared data functions:** `yuting/src/lib/trips.ts` (trip/photo/couple ops)
- **Static data:** `yuting/src/lib/provinces.ts` (province/city/scenic spot data)
- **Supabase helpers:** `yuting/src/lib/supabase-browser.ts`
- **Geo conversion:** `yuting/src/lib/geojson-to-svg.ts`

### New Cloud Function

- **Directory:** `cloudfunctions/{function-name}/`
- **Entry:** `cloudfunctions/{function-name}/index.js` with `exports.main` dispatcher pattern
- **Dependencies:** `cloudfunctions/{function-name}/package.json` with `wx-server-sdk`

### New Component (Web App)

- **Location:** `yuting/src/components/{component-name}.tsx`
- **Style:** Inline styles or Tailwind classes (project uses both -- heavy inline for wood theme)
- **Export:** Named default export, `'use client'` directive required

### New Hook

- **Location:** `yuting/src/hooks/use-{feature}.ts`
- **Pattern:** Follow `use-svg-zoom.ts` convention -- interface for options and return type

## Special Directories

### `yuting/public/geojson/`

- **Purpose:** Province boundary GeoJSON files for SVG map rendering
- **Naming:** `{pinyin_name}_geo.json` (e.g., `guang_dong_geo.json`)
- **Used by:** `yuting/src/lib/provinces.ts` -> `getGeoJsonFileName()` maps province name to GeoJSON file
- **Contains:** 34 GeoJSON files, one per Chinese province (including 山西 as `shan_xi_1_geo.json` and 陕西 as `shan_xi_2_geo.json` to disambiguate)
- **Generated:** No -- committed to repository

### `cloudfunctions/`

- **Purpose:** WeChat Cloud serverless functions
- **Deploy:** Upload individually via WeChat DevTools
- **Each function:** Contains `index.js` (entry point) and `package.json` (dependencies)
- **Pattern:** Single `exports.main` dispatcher with `action` switch -- each action maps to a handler function
- **Auth:** All functions use `wxContext.OPENID` from `cloud.getWXContext()` for user identification

### `yuting/src/app/` (App Router)

- **Purpose:** Next.js 16 App Router page directory
- **Convention:** Each directory with `page.tsx` becomes a route
- **All pages:** Use `'use client'` directive (client-side rendering)
- **Query params:** Accessed via `useSearchParams` from `next/navigation` (wrapped in `Suspense` boundary)
- **Navigation:** Uses `window.location.href` for cross-page navigation (full reload, not Next.js client routing)

### `yuting/src/lib/` (Data Layer)

- **Purpose:** All business logic and data access -- no API routes
- **Architecture:** Repository-like pattern -- functions in `trips.ts` act as the data access layer
- **Supabase:** Direct client-side queries using anon key, RLS policies enforce access control
- **Realtime:** Supabase Realtime channels used for live data sync on Home and Album pages

---

*Structure analysis: 2026-04-27*
