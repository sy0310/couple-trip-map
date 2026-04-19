# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**遇亭 (Yuting)** — A couple's travel map mini-program for recording shared trip memories via map visualization. Dual-frontend architecture:

1. **WeChat Mini Program** (`miniprogram/` + `cloudfunctions/`) — Primary product, native WeChat app with cloud development
2. **Web App** (`yuting/`) — Next.js 16 web version with Supabase backend, 3D room visualization

## Architecture

### WeChat Mini Program (Primary)

```
miniprogram/              # Frontend (WeChat native)
├── pages/
│   ├── index/            # Home: China map with visited provinces (light-up effect)
│   ├── province/         # Province detail: city list, visit stats, progress bars
│   ├── city/             # City detail: spot list, trip records, photo wall
│   ├── album/            # Photo album: year-grouped timeline view
│   └── profile/          # Profile: couple bind/unbind
├── app.js                # Entry: wx.cloud.init()
├── app.json              # Page routes, tabBar config
└── app.wxss              # Global styles

cloudfunctions/           # Serverless (WeChat Cloud)
├── couple/               # Couple binding: create, accept invite, generate codes
├── trip/                 # Trip CRUD: add/query/update/delete travel records
├── photo/                # Photo management: upload/query/delete
└── login/                # User login (minimal)
```

**Navigation flow**: Map → Province → City → Spot (multi-level drill-down)
**Database collections**: `users`, `couples`, `trips`, `locations`, `photos` (see `docs/database.md`)

### Web App (yuting/)

```
yuting/                   # Next.js 16 + React 19
├── src/
│   ├── app/              # App Router pages
│   │   ├── page.tsx      # Home with 3D room scene
│   │   ├── album/        # Album page
│   │   ├── profile/      # Profile page
│   │   ├── province/     # Province detail
│   │   └── city/         # City detail
│   ├── components/
│   │   ├── room-3d.tsx   # 3D room visualization (CSS-based)
│   │   ├── furniture.tsx # Furniture components
│   │   ├── texture.tsx   # Texture/wallpaper components
│   │   ├── amap.tsx      # AMap integration
│   │   ├── bottom-nav.tsx # Bottom navigation
│   │   └── warm-dust-particles.tsx # Particle effects
│   └── lib/
│       ├── supabase-browser.ts  # Supabase client (browser)
│       ├── database.types.ts    # Supabase DB types
│       └── provinces.ts         # Province data
└── .env.local             # Supabase credentials (gitignored)
```

Backend uses **Supabase** (PostgreSQL) instead of WeChat Cloud. Maps to same data model as mini program.

## Development Commands

### Web App (yuting/)

```bash
cd yuting
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
npm start        # Start production server
```

### Mini Program

Open `miniprogram/` directory in **WeChat DevTools**. No CLI build system — compilation is handled by DevTools.

### Deployment

```bash
./deploy.sh       # Commit + push mini program code to GitHub
```

Cloud functions must be uploaded individually via WeChat DevTools.

## Key Conventions

- Mini program uses native WXML/WXSS/JS (not Taro/uni-app)
- Cloud functions use Node.js with `wx-server-sdk`
- Web app uses Next.js App Router, Tailwind CSS v4, Turbopack
- All Chinese UI text (labels, titles, navigation)
- Color theme: `#FF6B81` (pink/romantic)
- PWA enabled for web version (`next-pwa`)

## Important Notes

- `miniprogram/app.js` contains `your-env-id` placeholder — must be replaced with real WeChat Cloud environment ID
- `yuting/.env.local` contains Supabase credentials — never commit
- The `yuting/` web app mirrors mini program pages for cross-platform access
- 3D room scene (`room-3d.tsx`) uses CSS perspective transforms for cozy room visualization
