# Codebase Structure

**Analysis Date:** 2026-04-26

## Directory Layout

```
couple-trip-map/
├── miniprogram/              # WeChat Mini Program frontend
│   ├── app.js                # App entry: wx.cloud.init()
│   ├── app.json              # Page routes, tabBar config
│   ├── app.wxss              # Global styles
│   ├── images/               # Tab bar icons (map, album, profile)
│   └── pages/
│       ├── index/            # Home: China map with visited provinces
│       ├── province/         # Province detail: city list, visit stats
│       ├── city/             # City detail: attractions, trips, photos
│       ├── album/            # Photo album: year-grouped timeline
│       └── profile/          # Profile: couple bind/unbind
│
├── cloudfunctions/           # WeChat Cloud serverless functions
│   ├── couple/               # Couple binding CRUD
│   ├── trip/                 # Trip CRUD
│   ├── photo/                # Photo upload/query/delete
│   └── login/                # User login (README only, no index.js)
│
├── yuting/                   # Next.js 16 Web App
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── layout.tsx    # Root layout: fonts, SVG filters
│   │   │   ├── page.tsx      # Home: 3D room scene
│   │   │   ├── globals.css   # Global Tailwind styles
│   │   │   ├── login/        # Login/register page
│   │   │   ├── auth/callback/# Supabase OAuth callback
│   │   │   ├── province/     # Province detail page
│   │   │   ├── city/         # City detail page
│   │   │   ├── album/        # Photo album page
│   │   │   └── profile/      # Profile page
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Data layer and utilities
│   │   └── middleware.ts     # Supabase SSR cookie handling
│   ├── public/               # Static assets
│   │   ├── geojson/          # Province boundary GeoJSON files
│   │   ├── icons/            # PWA icons
│   │   └── manifest.json     # PWA manifest
│   ├── .env.local            # Supabase credentials (gitignored)
│   └── package.json          # Dependencies
│
├── docs/
│   ├── database.md           # Database schema design
│   └── QUICKSTART.md         # Getting started guide
│
├── deploy.sh                 # Deploy script (mini program push)
├── project.config.json       # WeChat DevTools project config
└── CLAUDE.md                 # Project instructions for Claude
```

## Directory Purposes

### `miniprogram/` — WeChat Mini Program Frontend

- **Purpose:** Primary product — native WeChat mini program
- **Contains:** WXML templates, WXSS styles, Page JS files, app entry point
- **Key files:**
  - `miniprogram/app.js` — Cloud initialization, global data
  - `miniprogram/app.json` — Page routes (5 pages), tabBar config (3 tabs)
  - `miniprogram/app.wxss` — Global shared styles

### `miniprogram/pages/` — Mini Program Pages

- **Purpose:** One directory per page, following WeChat convention (`.js`, `.wxml`, `.wxss`)
- **Contains:**
  - `index/` — Home page: China map with visited provinces (light-up effect)
  - `province/` — Province detail: city list, visit stats, progress bars
  - `city/` — City detail: attraction list, trip records, photo wall
  - `album/` — Photo album: year-grouped timeline view
  - `profile/` — Profile: couple bind/unbind, user info

### `cloudfunctions/` — WeChat Cloud Serverless

- **Purpose:** Backend API for mini program (Node.js)
- **Contains:** Each function is a directory with `index.js` and `package.json`
- **Key files:**
  - `cloudfunctions/couple/index.js` — Couple binding: `bind` (create/join), `check`, `unbind`
  - `cloudfunctions/trip/index.js` — Trip CRUD: `add`, `list`, `update`, `delete`
  - `cloudfunctions/photo/index.js` — Photo: `upload`, `list`, `delete`
  - `cloudfunctions/login/` — Login function (README with example code, no `index.js` committed)

### `yuting/` — Next.js Web App

- **Purpose:** Web version with 3D room visualization, Supabase backend
- **Contains:** Full Next.js 16 project with App Router, Tailwind CSS v4, TypeScript

### `yuting/src/app/` — App Router Pages

- **Purpose:** File-based routing — each directory maps to a route
- **Route mapping:**
  - `/` → `yuting/src/app/page.tsx` — Home (3D room scene)
  - `/login` → `yuting/src/app/login/page.tsx` — Login/register
  - `/auth/callback` → `yuting/src/app/auth/callback/page.tsx` — Supabase OAuth callback
  - `/province` → `yuting/src/app/province/page.tsx` — Province detail (query: `?name=`)
  - `/city` → `yuting/src/app/city/page.tsx` — City detail (query: `?name=&province=&spot=`)
  - `/album` → `yuting/src/app/album/page.tsx` — Photo album
  - `/profile` → `yuting/src/app/profile/page.tsx` — Profile/settings

### `yuting/src/components/` — React Components

- **Purpose:** Shared UI components
- **Key files:**
  - `room-3d.tsx` — 3D room visualization (CSS perspective transforms)
  - `furniture.tsx` — Furniture components for 3D room
  - `texture.tsx` — Texture/wallpaper components
  - `wood-relief-map.tsx` — Province-level wood-relief style map
  - `wood-relief-city-map.tsx` — City-level wood-relief style map
  - `wood-map.tsx` — Base wood map component
  - `province-map.tsx` — Province map wrapper
  - `province-leaflet-map.tsx` — Province map with Leaflet
  - `province-map-leaflet.tsx` / `province-map-leaflet-inner.tsx` — Leaflet province integration
  - `city-map.tsx` — City map wrapper
  - `city-leaflet-map.tsx` — Leaflet-based city map
  - `leaflet-map.tsx` — Base Leaflet map component
  - `seal-marker.tsx` — Map marker with stamp/seal style
  - `svg-compass.tsx` — Compass decoration
  - `warm-dust-particles.tsx` — Particle effect overlay
  - `loading-screen.tsx` — Loading screen overlay
  - `bottom-nav.tsx` — Shared bottom navigation bar
  - `add-trip-form.tsx` — Add trip form modal
  - `edit-trip-form.tsx` — Edit trip form modal

### `yuting/src/lib/` — Data Layer and Utilities

- **Purpose:** All data operations, auth, and static data
- **Key files:**
  - `supabase-browser.ts` — Supabase client singleton (browser)
  - `database.types.ts` — Generated TypeScript types for Supabase schema
  - `trips.ts` — All CRUD operations: trips, photos, couples (582 lines)
  - `auth.ts` — Auth functions (`signInWithPassword`, `signUp`, `signOut`) + `useAuth` hook
  - `provinces.ts` — Static province/city/scenic spot data (557 lines, 34 provinces)

### `yuting/src/hooks/` — Custom React Hooks

- **Purpose:** Reusable hook logic
- **Key files:**
  - `use-svg-zoom.ts` — SVG zoom/pan interaction hook

### `yuting/public/` — Static Assets

- **Purpose:** Served directly by Next.js
- **Key files:**
  - `geojson/` — Province boundary GeoJSON files (34 files, one per province)
  - `icons/` — PWA app icons
  - `manifest.json` — PWA web app manifest
  - `room-bg.png` — 3D room background image

## Key File Locations

### Entry Points

- `miniprogram/app.js` — WeChat Mini Program entry (cloud init, global data)
- `yuting/src/app/layout.tsx` — Web App root layout (fonts, SVG filters)
- `yuting/src/app/page.tsx` — Web App home page (3D room)
- `yuting/src/middleware.ts` — Supabase SSR cookie middleware

### Configuration

- `miniprogram/app.json` — Mini program page routes, tabBar, window settings
- `yuting/package.json` — Web app dependencies and scripts
- `project.config.json` — WeChat DevTools project config
- `yuting/.env.local` — Supabase URL and anon key (gitignored)

### Core Logic

- `cloudfunctions/trip/index.js` — Trip CRUD for mini program
- `cloudfunctions/couple/index.js` — Couple binding for mini program
- `cloudfunctions/photo/index.js` — Photo operations for mini program
- `yuting/src/lib/trips.ts` — All data operations for web app
- `yuting/src/lib/auth.ts` — Auth for web app
- `yuting/src/lib/provinces.ts` — Static province/city data

### Testing

- `yuting/package.json` — `test:e2e` script runs Playwright
- Playwright config expected at project root (not found in scan)

## Naming Conventions

### Files

- **Mini Program:** `{page-name}/{page-name}.js|wxml|wxss` — page directory matches page name
- **Web App Components:** kebab-case for filenames (`room-3d.tsx`, `bottom-nav.tsx`)
- **Web App Pages:** directory name maps to route (`province/page.tsx` → `/province`)
- **Web App Lib/Utils:** kebab-case (`supabase-browser.ts`, `database.types.ts`)

### Components

- React components use PascalCase internally (`Room3D`, `BottomNav`, `WoodReliefMap`)
- Exported as named default exports

### Directories

- Page directories use lowercase kebab-case (`add-trip-form`, `edit-trip-form`)
- Feature directories group related files together

## Where to Add New Code

### New Page (Web App)

- **Implementation:** `yuting/src/app/{route-name}/page.tsx`
- **Components (if new):** `yuting/src/components/{component-name}.tsx`
- **Data functions (if new):** `yuting/src/lib/trips.ts` or new file in `yuting/src/lib/`

### New Page (Mini Program)

- **Implementation:** `miniprogram/pages/{page-name}/` directory with `.js`, `.wxml`, `.wxss`
- **Register route:** Add to `miniprogram/app.json` → `pages` array
- **Cloud function (if new):** `cloudfunctions/{function-name}/index.js` + `package.json`

### New Utility/Helper

- **Shared data functions:** `yuting/src/lib/trips.ts` (trip/photo/couple ops)
- **Static data:** `yuting/src/lib/provinces.ts` (province/city/scenic spot data)
- **Supabase helpers:** `yuting/src/lib/supabase-browser.ts`

### New Cloud Function

- **Directory:** `cloudfunctions/{function-name}/`
- **Entry:** `cloudfunctions/{function-name}/index.js` with `exports.main`
- **Dependencies:** `cloudfunctions/{function-name}/package.json`

### New Component (Web App)

- **Location:** `yuting/src/components/{component-name}.tsx`
- **Style:** Inline styles or Tailwind classes (project uses both)
- **Export:** Default export

## Special Directories

### `yuting/public/geojson/`

- **Purpose:** Province boundary GeoJSON files for map rendering
- **Naming:** `{pinyin_name}_geo.json` (e.g., `guang_dong_geo.json`)
- **Used by:** `yuting/src/lib/provinces.ts` → `getGeoJsonFileName()` maps province to GeoJSON file
- **Contains:** 34 GeoJSON files, one per Chinese province

### `cloudfunctions/`

- **Purpose:** WeChat Cloud serverless functions
- **Deploy:** Upload individually via WeChat DevTools
- **Each function:** Contains `index.js` (entry point) and `package.json` (dependencies)
- **Pattern:** Single `exports.main` dispatcher with `action` switch

### `yuting/src/app/` (App Router)

- **Purpose:** Next.js 16 App Router page directory
- **Convention:** Each directory with `page.tsx` becomes a route
- **All pages:** Use `'use client'` directive (client-side rendering)
- **Query params:** Accessed via `useSearchParams` from `next/navigation` (wrapped in `Suspense`)

---

*Structure analysis: 2026-04-26*
