# Coding Conventions

**Analysis Date:** 2026-04-20

## Naming Patterns

**Files:**
- Components: kebab-case (`bottom-nav.tsx`, `room-3d.tsx`, `leaflet-map.tsx`)
- Lib modules: kebab-case (`supabase-browser.ts`, `database.types.ts`)
- Pages: lowercase directories with `page.tsx` per Next.js App Router convention
- Tests: kebab-case with `.spec.ts` suffix (`home.spec.ts`)

**Functions:**
- camelCase with action prefixes: `getVisitedCities`, `createTrip`, `uploadPhoto`, `deleteTrip`
- Boolean helpers: not observed but follow `is`, `has`, `should` convention
- Event handlers: `handleCityClick`, `handleTripAdded`, `onSpotClick`

**Variables:**
- camelCase: `coupleId`, `visitedCities`, `geoJsonCityCount`
- React state: `const [cities, setCities] = useState<string[]>([])`

**Types:**
- PascalCase interfaces: `LeafletMapProps`, `CityMapProps`
- TypeScript utility types: `Pick<TripRow, 'id' | 'location_name'>`, `ReturnType<typeof getVisitedCitiesWithCoords>`

## Code Style

**Formatting:**
- No dedicated Prettier config — relies on ESLint defaults + Next.js config
- 2-space indentation throughout
- Semicolons used consistently
- Single quotes for strings in TSX

**Linting:**
- ESLint 9 with flat config (`eslint.config.mjs`)
- `eslint-config-next` for Next.js Core Web Vitals + TypeScript rules
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Import Organization

**Order:**
1. React/Next.js core imports (`react`, `next/navigation`)
2. Third-party libraries (`leaflet`, `@supabase/supabase-js`)
3. CSS imports (`leaflet/dist/leaflet.css`, `tailwindcss`)
4. Internal aliases (`@/lib/*`, `@/components/*`)

**Path Aliases:**
- `@/*` → `./src/*` (from `tsconfig.json`)

**Pattern example:**
```typescript
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { getCoupleId, getVisitedCities } from '@/lib/trips';
```

## Error Handling

**Patterns:**
- Supabase operations: log via `console.error`, return empty array or `null`
- No user-facing error messages from data layer — UI handles gracefully with empty state
- Failed fetches: `.catch(() => fallback)` pattern
- No error boundaries except Next.js `Suspense` fallbacks

```typescript
if (error) {
  console.error('Failed to fetch visited cities:', error.message);
  return [];
}
```

## Logging

**Framework:** `console.error` only

**Patterns:**
- Only for Supabase operation failures
- Include operation name + error message
- No production logging library

## Comments

**When to Comment:**
- JSDoc for public API functions (`src/lib/trips.ts` has `/** Get the couple_id... */`)
- Section dividers in CSS (`/* ── Texture Utilities ── */`)
- Inline comments for non-obvious logic

**JSDoc/TSDoc:**
- Used on public functions in `src/lib/trips.ts`
- Format: `/** Description */` with param/return types

## Function Design

**Size:**
- Most functions under 30 lines
- `deleteTrip` (50+ lines) handles multi-step cleanup (photos → storage → trip)
- `getVisitedCitiesWithCoords` (40+ lines) has photo counting loop

**Parameters:**
- Named object params for complex args: `createTrip(coupleId, { location_name, province, city, ... })`
- Optional callbacks: `onProgress?: (uploaded: number, total: number) => void`

**Return Values:**
- Data queries: typed arrays `Promise<TripRow[]>`
- Mutations: `Promise<boolean>` or `Promise<{ id: string; existed: boolean } | null>`

## Module Design

**Exports:**
- Named exports only — no default exports in lib modules
- Components: mix of default (`LeafletMap`) and named (`CityMap`, `RoomPanel`)

**Barrel Files:**
- None — direct imports from file paths

**Client/Server Split:**
- `'use client'` directive at top of browser-only components
- `dynamic import` with `ssr: false` for Leaflet/ECharts components

## Styling Conventions

**Approach:** Tailwind CSS v4 utility classes + inline `style` props for design tokens

**Color system:** Material Design 3 tokens in `src/app/globals.css`
- `--primary`, `--secondary`, `--tertiary` for brand colors
- `--surface-*` variants for backgrounds
- Accessed via `style={{ color: 'var(--primary)' }}` or Tailwind `bg-primary`

**Texture utilities:** CSS classes for wood/parchment textures
- `.wood-texture`, `.wood-walnut`, `.wood-pine`, `.parchment-texture`
- SVG noise filter backgrounds for organic feel

**Spacing:** Tailwind utility classes (`mb-5`, `gap-8`, `px-4`)

---

*Convention analysis: 2026-04-20*
