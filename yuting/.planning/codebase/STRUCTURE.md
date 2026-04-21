# Codebase Structure

**Analysis Date:** 2026-04-20

## Directory Layout

```
yuting/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Home: 3D room + visited provinces
│   │   ├── layout.tsx    # Root layout, providers
│   │   ├── globals.css   # Global styles, design tokens
│   │   ├── album/        # Photo album page
│   │   ├── auth/callback/ # Supabase auth callback handler
│   │   ├── city/         # City detail page (scenic spots map)
│   │   ├── login/        # Login page
│   │   ├── profile/      # Profile page (couple binding)
│   │   └── province/     # Province detail page (city list, map)
│   ├── components/       # React UI components
│   │   ├── add-trip-form.tsx    # Trip creation form
│   │   ├── edit-trip-form.tsx   # Trip editing form
│   │   ├── bottom-nav.tsx       # Bottom navigation bar
│   │   ├── city-map.tsx         # City-level Leaflet map
│   │   ├── leaflet-map.tsx      # Core Leaflet map component
│   │   ├── province-map.tsx     # Legacy ECharts province map
│   │   ├── province-map-leaflet.tsx       # Leaflet province map wrapper
│   │   ├── province-map-leaflet-inner.tsx # Leaflet province map inner
│   │   ├── room-3d.tsx              # 3D room CSS perspective scene
│   │   ├── furniture.tsx            # Furniture components for room
│   │   ├── texture.tsx              # Texture/wallpaper components
│   │   ├── warm-dust-particles.tsx  # Particle effect overlay
│   │   └── wood-map.tsx             # Wooden-style map component
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Data access and utilities
│       ├── auth.ts                # Supabase auth helpers
│       ├── database.types.ts      # Supabase-generated TypeScript types
│       ├── provinces.ts           # Province/city static data
│       ├── supabase-browser.ts    # Supabase client factory (singleton)
│       └── trips.ts               # Trip/photo CRUD operations
├── public/
│   ├── china.json          # National boundary GeoJSON
│   ├── geojson/            # Province-level GeoJSON files (31 files)
│   ├── icons/              # PWA icons
│   ├── room-bg.png         # 3D room background image
│   └── manifest.json       # PWA manifest
├── tests/e2e/          # Playwright E2E tests
│   ├── album.spec.ts
│   ├── home.spec.ts
│   ├── login.spec.ts
│   ├── navigation.spec.ts
│   └── profile.spec.ts
├── migrations/
│   └── 001_initial_schema.sql  # Database schema
└── config files: next.config.ts, tsconfig.json, eslint.config.mjs, etc.
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router page routes
- Contains: `page.tsx`, `layout.tsx`, `globals.css` per route
- Key files: `src/app/page.tsx` (home), `src/app/province/page.tsx` (province detail)

**`src/components/`:**
- Purpose: Reusable React UI components
- Contains: TSX files with component logic
- Key files: `leaflet-map.tsx`, `city-map.tsx`, `room-3d.tsx`

**`src/lib/`:**
- Purpose: Data access layer, business logic, static data
- Contains: TypeScript modules with Supabase queries and province data
- Key files: `trips.ts` (CRUD), `provinces.ts` (static geo data), `supabase-browser.ts` (client)

**`public/geojson/`:**
- Purpose: Province boundary GeoJSON files
- Contains: 31 JSON files named `pinyin_geo.json`
- Generated: No — from `china-geojson` npm package

**`tests/e2e/`:**
- Purpose: Playwright end-to-end tests
- Contains: `.spec.ts` files per feature area
- Generated: No — hand-written tests

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Home page (3D room scene)
- `src/app/layout.tsx`: Root layout with providers

**Configuration:**
- `next.config.ts`: Next.js build config
- `tsconfig.json`: TypeScript config (`@/*` path alias)
- `playwright.config.ts`: E2E test config
- `.env.local`: Supabase credentials (gitignored)

**Core Logic:**
- `src/lib/trips.ts`: All trip/photo CRUD operations
- `src/lib/auth.ts`: Auth helpers (binding codes, couple lookup)
- `src/lib/provinces.ts`: Static province/city data with coordinates

**Testing:**
- `tests/e2e/`: Playwright E2E test specs

## Naming Conventions

**Files:**
- Components: kebab-case (`bottom-nav.tsx`, `room-3d.tsx`)
- Pages: lowercase directory with `page.tsx` (Next.js convention)
- Lib modules: kebab-case (`supabase-browser.ts`, `database.types.ts`)
- Tests: kebab-case with `.spec.ts` suffix (`home.spec.ts`)

**Directories:**
- App routes: lowercase (`album/`, `city/`, `province/`)
- Components: kebab-case (`src/components/`)
- Feature areas: lowercase

**Functions:**
- camelCase (`getVisitedCities`, `createTrip`, `uploadPhoto`)
- Async functions with descriptive verb prefixes (`fetch`, `get`, `create`, `update`, `delete`)

## Where to Add New Code

**New Feature Page:**
- Implementation: `src/app/<feature-name>/page.tsx`
- Component: `src/components/<feature-name>.tsx` if extracted

**New Data Operation:**
- Add to: `src/lib/trips.ts` (trip-related) or create new `src/lib/<domain>.ts`

**New Component:**
- Implementation: `src/components/<component-name>.tsx`

**New E2E Test:**
- Location: `tests/e2e/<feature-name>.spec.ts`

**Utilities:**
- Shared helpers: `src/lib/<domain>.ts` (organized by domain, not generic utils)

---

*Structure analysis: 2026-04-20*
