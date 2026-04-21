# Technology Stack

**Analysis Date:** 2026-04-20

## Languages

**Primary:**
- TypeScript 5.x — All frontend application code (`src/`), config files, and tests
- SQL — Supabase migrations (`migrations/001_initial_schema.sql`)

**Secondary:**
- JavaScript — WeChat mini program cloud functions (separate `cloudfunctions/` directory outside this project root)

## Runtime

**Environment:**
- Node.js (via Next.js 16)

**Package Manager:**
- npm (lockfile: `package-lock.json` present)

## Frameworks

**Core:**
- Next.js 16.2.4 — React framework with App Router, SSR/SSG
- React 19.2.4 — UI library
- React DOM 19.2.4

**Styling:**
- Tailwind CSS v4 — Utility-first CSS with `@tailwindcss/postcss` integration
- CSS Custom Properties — Design tokens in `src/app/globals.css`

**Map/Geospatial:**
- Leaflet 1.9.4 + react-leaflet 5.0.0 — Interactive map rendering (province/city pages)
- ECharts 6.0.0 + echarts-for-react 3.0.6 — Alternative map visualization (`src/components/province-map.tsx`, `src/components/wood-map.tsx`)
- china-geojson 1.0.0 — Province/city boundary GeoJSON data (symlinked to `public/geojson/`)

**Testing:**
- Playwright 1.59.1 — E2E testing framework

**Build/Dev:**
- Turbopack (via Next.js 16 default)
- ESLint 9 — Linting

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.103.3 — Supabase JS client for database + auth
- `@supabase/ssr` 0.10.2 — Supabase SSR cookie handling for Next.js
- `next-pwa` 5.6.0 — Progressive Web App support

**Infrastructure:**
- `@types/leaflet` 1.9.21 — TypeScript definitions for Leaflet
- `@types/react` 19 / `@types/react-dom` 19 — TypeScript definitions

## Configuration

**Environment:**
- `.env.local` — Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — gitignored
- `.env.example` — Template for required env vars

**Build:**
- `next.config.ts` — Next.js configuration
- `tsconfig.json` — TypeScript configuration with path alias `@/*` → `./src/*`
- `postcss.config.mjs` — Tailwind CSS v4 integration
- `eslint.config.mjs` — ESLint 9 flat config
- `playwright.config.ts` — Playwright E2E config with chromium/webkit projects

## Platform Requirements

**Development:**
- Node.js or npm runtime
- Supabase project (for backend)
- WeChat DevTools (for mini program, separate codebase)

**Production:**
- Vercel deployment (inferred from `vercel.svg` public asset and `vercel.json` in parent)
- Supabase production database

---

*Stack analysis: 2026-04-20*
