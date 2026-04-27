# Technology Stack

**Analysis Date:** 2026-04-27

## Project Overview

Dual-frontend architecture for the 遇亭 (Yuting) couple's travel map:
1. **WeChat Mini Program** (`miniprogram/` + `cloudfunctions/`) — Primary product, native WeChat app
2. **Web App** (`yuting/`) — Next.js 16 web version with Supabase backend

## Languages

**Primary:**
- **JavaScript (ES6+)** — WeChat miniprogram pages and cloud functions
- **TypeScript 5.x** — Web app (`yuting/`), strict mode enabled

**Secondary:**
- **WXML/WXSS** — WeChat miniprogram template and styling language

## Runtime

**Miniprogram:**
- WeChat Mini Program runtime (base library v2.19.4, `project.config.json` line 44)
- WeChat Cloud Functions (Node.js serverless, `wx-server-sdk`)

**Web App:**
- **Node.js** — Next.js 16.2.4 runtime
- **React 19.2.4** — UI framework
- **Package Manager:** npm (lockfile: `yuting/package-lock.json` present)

## Frameworks

### WeChat Miniprogram (Primary Product)
- **WeChat Mini Program SDK** — Native WXML/WXSS/JS (not Taro/uni-app)
- **WeChat Cloud Development** (`wx-server-sdk@latest`) — Serverless backend
- Base library: 2.19.4, requires 2.2.3+ for cloud capabilities (`miniprogram/app.js:5`)

### Web App (yuting/)
**Core:**
- **Next.js 16.2.4** — App Router, React Server Components, Turbopack enabled (`yuting/next.config.ts`)
- **React 19.2.4** / **React DOM 19.2.4**
- **Tailwind CSS v4** — via `@tailwindcss/postcss` plugin (`yuting/postcss.config.mjs`)

**Maps & Visualization:**
- **Leaflet 1.9.4** + **react-leaflet 5.0.0** — Interactive map rendering (`yuting/src/components/leaflet-map.tsx`)
- **ECharts 6.0.0** + **echarts-for-react 3.0.6** — Province/city map rendering with GeoJSON (`yuting/src/components/province-map.tsx`)
- **china-geojson 1.0.0** — China province GeoJSON data

**Auth & Backend:**
- **@supabase/supabase-js 2.103.3** — Supabase client
- **@supabase/ssr 0.10.2** — SSR cookie handling (`yuting/src/middleware.ts`)

**PWA:**
- **next-pwa 5.6.0** — PWA support, disabled in dev (`yuting/next.config.ts:4-9`)

**Testing:**
- **Playwright 1.59.1** — E2E testing (`yuting/playwright.config.ts`)
- Test directory: `yuting/tests/e2e/` (5 spec files: `home.spec.ts`, `login.spec.ts`, `album.spec.ts`, `profile.spec.ts`, `navigation.spec.ts`)

**Build/Dev:**
- **Turbopack** — Next.js 16 bundler (enabled in `yuting/next.config.ts:17`)
- **ESLint 9** + **eslint-config-next 16.2.4** — Linting
- **TypeScript 5** — strict mode, path alias `@/*` -> `./src/*` (`yuting/tsconfig.json:22`)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.103.3 — Primary backend for web app
- `wx-server-sdk` latest — Cloud functions for miniprogram
- `leaflet` 1.9.4 + `react-leaflet` 5.0.0 — Map rendering (`yuting/src/components/leaflet-map.tsx`)
- `echarts` 6.0.0 + `echarts-for-react` 3.0.6 — Map visualization (`yuting/src/components/province-map.tsx`)

**Infrastructure:**
- `china-geojson` 1.0.0 — China province boundary data
- `next-pwa` 5.6.0 — Progressive Web App support
- `@supabase/ssr` 0.10.2 — SSR auth middleware

**Note on dependency freshness:** All dependencies are recent/current. Supabase JS SDK is at latest major (2.x). React 19 and Next.js 16 are the newest major versions. Dependencies are lightweight — no heavy component libraries or large frameworks pulled in.

## Configuration

**Miniprogram:**
- `miniprogram/app.js` — Entry point with `wx.cloud.init()` (line 7)
  - Contains placeholder `env: 'your-env-id'` (line 11) — must be replaced before deployment
- `miniprogram/app.json` — Page routes, tabBar config (3 tabs: 地图, 相册, 我的)
- `project.config.json` — WeChat DevTools project config
  - App ID placeholder: `wx YOUR_APP_ID` (line 42)

**Web App:**
- `yuting/.env.local` — Supabase credentials (gitignored, present)
- `yuting/.env.example` — Template with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional AMap keys
- `yuting/next.config.ts` — Next.js config with PWA, Turbopack, image remote patterns for `**.supabase.co`
- `yuting/tsconfig.json` — Target ES2017, strict mode, `@/*` path alias

**Deployment:**
- `deploy.sh` — Shell script: `git add .` -> `git commit` -> `git push origin main`
- Cloud functions deployed individually via WeChat DevTools upload
- Web app: `npm run build` -> `npm start` (standard Next.js)
- GitHub repo: `https://github.com/sy0310/couple-trip-map`

## Platform Requirements

**Development:**
- WeChat DevTools (for miniprogram) — no CLI build
- Node.js 20+ (for web app, `@types/node: ^20`)
- Replace `your-env-id` in `miniprogram/app.js` before testing cloud functions

**Production:**
- WeChat Mini Program — published via WeChat platform
- Web app — deployable on Vercel/any Node.js host (PWA enabled, Supabase backend)
- Supabase project required for web app (PostgreSQL + Storage)

## Cloud Functions (4 total)

All use `wx-server-sdk@latest` with `cloud.DYNAMIC_CURRENT_ENV`:

| Function | File | Purpose |
|----------|------|---------|
| `couple` | `cloudfunctions/couple/index.js` | Couple binding: create/join/check/unbind |
| `trip` | `cloudfunctions/trip/index.js` | Trip CRUD: add/list/update/delete |
| `photo` | `cloudfunctions/photo/index.js` | Photo management: upload/list/delete |
| `login` | `cloudfunctions/login/index.js` | User login (minimal) |

---

*Stack analysis: 2026-04-27*
