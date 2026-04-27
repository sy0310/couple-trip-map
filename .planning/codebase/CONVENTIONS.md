# Coding Conventions

**Analysis Date:** 2026-04-26

## Project Overview

Dual-frontend architecture:
1. **WeChat Mini Program** (`miniprogram/`) — Native WXML/WXSS/JS
2. **Web App** (`yuting/`) — Next.js 16 + React 19 + TypeScript + Tailwind CSS v4

## Naming Patterns

### Files

**Web App (`yuting/src/`):**
- Components: kebab-case filenames, PascalCase exports — `bottom-nav.tsx` exports `BottomNav`
- Pages: Next.js App Router convention — `page.tsx` in route folders (`/album/page.tsx`, `/profile/page.tsx`)
- Lib/utilities: kebab-case — `supabase-browser.ts`, `database.types.ts`, `provinces.ts`
- Hooks: camelCase with `use` prefix — `use-svg-zoom.ts` exports `useSvgZoom`
- Layout: `layout.tsx` at root of `src/app/`
- Middleware: `middleware.ts` at root of `src/app/`

**Mini Program (`miniprogram/`):**
- Page files follow WeChat convention: `{page}.js`, `{page}.wxml`, `{page}.wxss` grouped in `pages/{name}/`
- Cloud functions: `index.js` + `package.json` in `cloudfunctions/{name}/`

### Functions

- Web: camelCase for all functions — `getCoupleId`, `loadTrips`, `handleSetCover`
- Mini program: camelCase with verb prefix — `loadAlbumData`, `groupTripsByYear`, `viewPhoto`
- Event handlers in React: `handleXxx` prefix — `handleSubmit`, `handleSignOut`, `handleUploadPhotos`

### Variables

- camelCase throughout both frontends
- React state: `const [loading, setLoading] = useState(false)`
- Constants: UPPER_SNAKE_CASE for module-level constants — `TOTAL_PROVINCES` in `src/lib/provinces.ts`
- CSS custom properties: kebab-case with `--` prefix — `--primary`, `--surface`, `--color-background`

### CSS Classes

**Web App:** Tailwind CSS v4 utility classes combined with custom CSS utility classes in `globals.css`:
- Utility classes: `.wood-texture`, `.wood-walnut`, `.wood-pine`, `.parchment-texture`, `.ambient-shadow`, `.wood-recess`, `.brass-highlight`
- All custom utilities defined in `yuting/src/app/globals.css` (lines 139-172)
- No CSS modules used — relies on Tailwind + inline styles

**Mini Program:** BEM-like kebab-case class names — `.stats-card`, `.stats-title`, `.map-placeholder`, `.recent-item`

## File Organization

### Web App (`yuting/src/`)

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with fonts, metadata
│   ├── page.tsx            # Home page (3D room scene)
│   ├── globals.css         # Global styles, CSS custom properties
│   ├── album/page.tsx      # Album page
│   ├── profile/page.tsx    # Profile page
│   ├── login/page.tsx      # Login/signup page
│   ├── province/page.tsx   # Province detail
│   ├── city/page.tsx       # City detail
│   └── auth/callback/      # Supabase auth callback
├── components/             # All UI components (flat, not nested)
│   ├── bottom-nav.tsx      # Bottom navigation bar
│   ├── room-3d.tsx         # 3D room visualization (main page)
│   ├── wood-map.tsx        # Wood-style China map
│   ├── add-trip-form.tsx   # Trip creation form
│   ├── edit-trip-form.tsx  # Trip edit form
│   └── ...
├── hooks/                  # Custom React hooks
│   └── use-svg-zoom.ts     # SVG pan/zoom hook
├── lib/                    # Utilities and API layer
│   ├── supabase-browser.ts # Supabase client factory (singleton)
│   ├── trips.ts            # All data access functions (trips, photos, couples)
│   ├── auth.ts             # Auth functions + useAuth hook
│   ├── provinces.ts        # Province data
│   ├── database.types.ts   # Supabase-generated types
│   └── geojson-to-svg.ts   # GeoJSON conversion
└── middleware.ts           # Next.js middleware (Supabase cookie sync)
```

**Key pattern:** All page components are `'use client'` — no server components currently used. Components are in a flat directory (not nested by feature).

### Mini Program (`miniprogram/`)

```
miniprogram/
├── app.js                  # Entry: wx.cloud.init(), globalData
├── app.json                # Page routes, tabBar config
├── app.wxss                # Global styles (.container, .card, .btn-primary, flex utilities)
├── pages/
│   ├── index/              # Home: China map
│   ├── province/           # Province detail
│   ├── city/               # City detail
│   ├── album/              # Photo album
│   └── profile/            # Profile
└── images/                 # TabBar icons
```

## Styling Approach

### Web App: Tailwind CSS v4 + Inline Styles + CSS Custom Properties

**Three-layer styling:**

1. **Tailwind v4** (`@import "tailwindcss"`) — utility classes for layout, spacing, typography
   - Config via `@theme inline` in `globals.css` mapping CSS custom properties to Tailwind colors
   - Example: `className="flex justify-around items-center h-16 max-w-[800px] mx-auto"`

2. **CSS Custom Properties** — design tokens in `:root` of `globals.css`
   - Full Material Design 3-inspired palette (`--primary`, `--surface`, `--on-surface`, etc.)
   - Font variables: `--font-manrope`, `--font-newsreader`
   - Theme colors mapped via `@theme inline` for Tailwind usage

3. **Inline `style` props** — heavy use of inline styles for:
   - Gradient backgrounds: `background: 'linear-gradient(135deg, #4a2e1d, #352118)'`
   - Custom shadows: `boxShadow: '0 25px 50px rgba(20, 10, 5, 0.4)'`
   - Specific colors not in Tailwind palette: `color: '#ffdea5'`
   - Font families: `fontFamily: "'Newsreader', serif"`

**No CSS modules, no styled-components, no SCSS.** Texture effects use inline SVG filters (`feTurbulence`) as data URIs in `background-image`.

### Mini Program: WXSS (WeChat CSS)

- Global styles in `app.wxss` with utility classes (`.container`, `.card`, `.btn-primary`, `.flex`, `.flex-center`, `.flex-between`)
- Page-specific styles in `{page}.wxss` using `rpx` units (responsive pixels)
- Primary color: `#FF6B81` (pink/romantic theme)
- Background: `#F6F6F6` (light gray)

## Error Handling

### Web App

**Pattern:** Return `null` or `false` on failure, log to console:

```typescript
// In yuting/src/lib/trips.ts
if (error) {
  console.error('Failed to create trip:', error.message);
  return null;
}
```

- All Supabase operations check `{ error }` and log to `console.error`
- Functions return `null`/`false` on failure (no thrown exceptions)
- UI-level error state managed via React `useState` — `const [error, setError] = useState('')`
- Form validation in login page checks email/password before API call
- **No Zod or schema validation** used — manual validation in form handlers

### Mini Program

- `wx.showToast({ title: '加载失败', icon: 'error' })` for user-visible errors
- `fail` callbacks on `wx.cloud.callFunction` silently swallow errors in some cases (e.g., `loadCityPhotos` in `city.js` line 133)
- Error messages in Chinese

## API Call Patterns

### Web App: Supabase Browser Client

**Client factory** (`yuting/src/lib/supabase-browser.ts`):
- Singleton pattern — single Supabase client instance reused across calls
- Generic type parameter `Database` from generated types

**Data access** (`yuting/src/lib/trips.ts`):
- All data functions are `async` and return typed results
- Pattern: `createClient()` → `.from('table').select(...).eq(...).order(...)`
- Type assertions used for Supabase queries: `as { data: ...; error: ... }`
- `as never` used for inserts/updates to bypass type constraints
- Real-time subscriptions via Supabase channels:
  ```typescript
  client.channel('home-trip-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: ... }, () => loadData(coupleId))
    .subscribe()
  ```

**Auth** (`yuting/src/lib/auth.ts`):
- `useAuth()` hook tracks auth state via `supabase.auth.onAuthStateChange`
- Auth functions: `signInWithPassword`, `signUp`, `signOut`
- Auth callback route at `yuting/src/app/auth/callback/page.tsx`

**Middleware** (`yuting/src/middleware.ts`):
- Next.js middleware syncs Supabase cookies on every request
- Uses `@supabase/ssr` `createServerClient` for cookie handling

### Mini Program: WeChat Cloud Functions

- Cloud functions accessed via `wx.cloud.callFunction({ name: 'trip/list', data: {...} })`
- Each cloud function exports `main` handler with `action` switch
- Database via `cloud.database()` with `db.collection('...').where(...).get()`
- Auth via `cloud.getWXContext()` — automatic WeChat user context

## Code Style, Formatting, and Linting

### Web App

- **TypeScript strict mode** enabled — `yuting/tsconfig.json`: `"strict": true`
- **ESLint** v9 with Next.js config — `yuting/eslint.config.mjs`:
  - Uses `eslint-config-next` for core-web-vitals and TypeScript rules
  - Ignores `.next/`, `out/`, `build/`, `next-env.d.ts`
- **Tailwind CSS v4** with `@tailwindcss/postcss` plugin
- **Turbopack** enabled in `next.config.ts`
- **Prettier**: Not configured (no `.prettierrc` or `prettier` in package.json)
- **No formatter or auto-format hook** configured

### Mini Program

- No linting or formatting config detected
- WeChat DevTools handles compilation
- Style v2 enabled (`"style": "v2"` in `app.json`)

## Import Organization

**Web App import order** (observed pattern):
1. React/Next.js built-ins first (`'react'`, `'next/navigation'`, `'next/image'`)
2. Third-party libraries (`'@supabase/supabase-js'`, `'@supabase/ssr'`)
3. Internal `@/` aliased imports (`@/lib/...`, `@/components/...`)

**Path aliases:** `@/*` maps to `./src/*` (tsconfig.json line 22)

## Recurring Patterns

### `'use client'` Directive

Every page component and many components use `'use client'` at the top — no server components or server actions currently in use.

### Dynamic Imports for Side Effects

Heavy use of `import('@/lib/supabase-browser').then(m => m.createClient())` pattern for lazy-loading the Supabase client inside `useEffect` callbacks.

### Inline SVG Icons

All icons are inline SVG components defined within their using file — no icon library used. Example: `bottom-nav.tsx` defines `MapIcon`, `AlbumIcon`, `ProfileIcon` as local components.

### Texture Overlays via SVG feTurbulence

Custom texture effects (wood grain, parchment) implemented using inline SVG `<feTurbulence>` filters encoded as data URIs in `background-image`. Filters also defined in `<svg>` elements in `layout.tsx`.

### Modal Content as JSX Variables

Profile page (`yuting/src/app/profile/page.tsx`) defines modal content as JSX variables (`coupleModalContent`, `settingsModalContent`) rather than separate components.

## Anti-Patterns

### Mixed Styling Approaches

**What happens:** Components mix Tailwind utility classes with extensive inline `style` objects and occasional custom CSS classes.
**Why it's problematic:** Makes refactoring harder, prevents theme changes via CSS alone, and creates visual inconsistency risks.
**Do this instead:** Use CSS custom properties for colors/shadows and Tailwind for layout. Keep inline styles to truly dynamic values only.

### Singleton Supabase Client

**What happens:** `yuting/src/lib/supabase-browser.ts` creates a single global client instance (`let _client: Client | null = null`).
**Why it's problematic:** No auth state isolation between concurrent requests, potential issues with SSR/edge contexts.
**Do this instead:** Create a fresh client per request/context, or use the `@supabase/ssr` pattern already used in middleware.

### Untyped Supabase Query Results

**What happens:** Manual type assertions like `as { data: Pick<CoupleRow, 'id'> | null; error: ... }` repeated throughout `yuting/src/lib/trips.ts`.
**Why it's problematic:** Bypasses Supabase's generated types, risks type mismatches if schema changes.
**Do this instead:** Use Supabase's `.select()` with typed generics or `satisfies` operator for safer type narrowing.

### `as never` Inserts

**What happens:** Supabase `.insert({ ... } as never)` used to bypass type constraints.
**Why it's problematic:** Defeats the purpose of generated types entirely.
**Do this instead:** Fix the insert data shape to match the generated `Insert` type, or use partial types.

### console.error in Production Code

**What happens:** `console.error` used throughout `yuting/src/lib/trips.ts` for all error logging.
**Why it's problematic:** Per user rules, no `console.log`/`console.error` in production code.
**Do this instead:** Use a proper logging library or error tracking service.

---

*Convention analysis: 2026-04-26*
