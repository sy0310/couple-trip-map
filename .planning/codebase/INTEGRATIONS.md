# External Integrations

**Analysis Date:** 2026-04-27

## Cloud Services

### WeChat Cloud Development (Miniprogram Backend)
- **SDK:** `wx-server-sdk@latest`
- **Init:** `miniprogram/app.js:7-13` — `wx.cloud.init({ env: 'your-env-id', traceUser: true })`
- **Environment ID placeholder:** `your-env-id` in `miniprogram/app.js:11` (must be replaced)
- **App ID placeholder:** `wx YOUR_APP_ID` in `project.config.json:42` (must be replaced)
- **Cloud functions:** 4 functions under `cloudfunctions/` (`couple`, `trip`, `photo`, `login`)
- **Database:** WeChat Cloud JSON database (document-oriented)
- **Storage:** WeChat Cloud Storage for photo files
- **Auth:** WeChat OpenID-based authentication (automatic via `cloud.getWXContext()`, no login flow needed)

### Supabase (Web App Backend)
- **SDK:** `@supabase/supabase-js` 2.103.3
- **SSR Helper:** `@supabase/ssr` 0.10.2
- **Client:** `yuting/src/lib/supabase-browser.ts` — singleton `createClient()` wrapping `createSupabaseClient<Database>()`
- **Middleware:** `yuting/src/middleware.ts` — `createServerClient()` with cookie-based session persistence via Next.js middleware
- **Auth:** Supabase Auth (email/password) — `yuting/src/lib/auth.ts` provides `signInWithPassword()`, `signUp()`, `signOut()`, `useAuth()` hook
- **Storage:** Supabase Storage bucket named `photos` — used in `yuting/src/lib/trips.ts:378-388` (`supabase.storage.from('photos').upload()`)
- **Database:** PostgreSQL — typed via `yuting/src/lib/database.types.ts`
- **Realtime:** Supabase Realtime subscription used in `yuting/src/app/page.tsx:43-53` — `client.channel('home-trip-changes').on('postgres_changes', ...)` for live trip updates

## Map APIs & Geospatial

### Leaflet (Web App)
- **Library:** `leaflet` 1.9.4 + `react-leaflet` 5.0.0
- **TileLayer:** OpenStreetMap (default, no API key required) — `yuting/src/components/leaflet-map.tsx:150`
- **Components:**
  - `yuting/src/components/leaflet-map.tsx` — Core map with `MapContainer`, `TileLayer`, `Marker`, `Popup`, `GeoJSON`
  - `yuting/src/components/province-map-leaflet.tsx` — Province-level map
  - `yuting/src/components/province-map-leaflet-inner.tsx` — Inner province map rendering
  - `yuting/src/components/province-leaflet-map.tsx` — Province leaflet map
  - `yuting/src/components/city-leaflet-map.tsx` — City-level map
  - `yuting/src/components/city-map.tsx` — City map wrapper
  - `yuting/src/components/wood-relief-map.tsx` — Wood-textured relief map
  - `yuting/src/components/wood-relief-city-map.tsx` — City relief map
- **GeoJSON:** `china-geojson` 1.0.0 — China province boundary data (bundled)
- **GeoJSON conversion:** `yuting/src/lib/geojson-to-svg.ts` — converts GeoJSON to SVG for custom map rendering

### ECharts (Web App Province Maps)
- **Library:** `echarts` 6.0.0 + `echarts-for-react` 3.0.6
- **Runtime GeoJSON fetch:** `yuting/src/components/province-map.tsx:28` — fetches province boundaries from Aliyun DataV API: `https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json`
- **Usage:** Province detail maps with scatter overlays for visited cities

### AMap (高德地图) — Optional/Configured but Unused
- **Config:** `yuting/.env.example` defines `NEXT_PUBLIC_AMAP_KEY` and `NEXT_PUBLIC_AMAP_SECURITY_CODE`
- **Note:** No AMap component exists in `yuting/src/components/`. AMap is configured as optional but not actively used. The web app uses Leaflet for all map rendering.

## Database Collections

### WeChat Cloud Database (Miniprogram)
5 collections, documented in `docs/database.md`:

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User profiles | `_openid`, `nickName`, `avatarUrl`, `createTime` |
| `couples` | Couple relationships | `userA`, `userB`, `status`, `inviteCode`, `createTime` |
| `trips` | Travel records | `coupleId`, `locationId`, `visitDate`, `province`, `city`, `spot` |
| `locations` | Geographic data | `name`, `level`, `parentId`, `lat`, `lng` |
| `photos` | Photo records | `tripId`, `fileID`, `takenAt`, `uploadedBy` |

**Permission model** (`docs/database.md:156-165`):
- Read: `auth.openid == doc._openid || auth.openid in doc.coupleMembers`
- Write: `auth.openid == doc._openid`

### Supabase Database (Web App)
4 typed tables in `yuting/src/lib/database.types.ts`:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | User profiles | `id` (string/PK), `nickname`, `avatar_url`, `created_at` |
| `couples` | Couple relationships | `id`, `user_a_id`, `user_b_id`, `binding_code`, `created_at`, `updated_at` |
| `trips` | Travel records | `id`, `couple_id`, `location_name`, `province`, `city`, `scenic_spot`, `lat`, `lng`, `visit_date`, `photo_count` |
| `photos` | Photo records | `id`, `trip_id`, `file_url`, `description`, `taken_at`, `created_at` |

**Additional:** Supabase RPC function `get_partner_nickname` used in `yuting/src/lib/trips.ts:162` to fetch partner info.

## Authentication Flows

### Miniprogram (WeChat OpenID)
1. User opens miniprogram -> `wx.cloud.init()` called in `miniprogram/app.js:7`
2. WeChat automatically provides `OPENID` via `cloud.getWXContext()` in cloud functions
3. Login cloud function (`cloudfunctions/login/README.md`) handles user registration
4. Couple binding uses an 8-character alphanumeric code flow (`cloudfunctions/couple/index.js`):
   - User A calls `bind` with `create` action -> generates unique binding code
   - User A shares code with User B
   - User B calls `bind` with `join` action + code -> links accounts

### Web App (Supabase Auth)
1. Email/password auth via Supabase (`yuting/src/lib/auth.ts`)
2. `signUp(email, password, nickname)` -> creates user in Supabase Auth with nickname metadata
3. `signInWithPassword(email, password)` -> returns session
4. `useAuth()` hook (`yuting/src/lib/auth.ts:53-77`) — React hook tracking auth state via `supabase.auth.getSession()` + `onAuthStateChange()` subscription
5. Next.js middleware (`yuting/src/middleware.ts`) runs `supabase.auth.getUser()` on every request for cookie-based session refresh
6. Auth callback route: `yuting/src/app/auth/callback/page.tsx`
7. Login page: `yuting/src/app/login/page.tsx`

### Couple Binding (Web App)
Implemented in `yuting/src/lib/trips.ts`:
- `generateBindingCode()` (line 19-51) — creates 6-char alphanumeric code in `couples` table
- `acceptBindingCode(code)` (line 58-85) — finds couple by code, sets current user as `user_b_id`
- `getCoupleInfo()` (line 141-175) — fetches couple + partner info
- `deleteCoupleBinding()` (line 91-116) — removes couple record

## Data Storage

**Miniprogram:**
- Database: WeChat Cloud JSON database (document store)
- Files: WeChat Cloud Storage (auto-managed)

**Web App:**
- Database: Supabase PostgreSQL
- Files: Supabase Storage bucket `photos` — path pattern `{coupleId}/{uuid}.{ext}`
- Configured in `yuting/next.config.ts:13-16` — image remote patterns allow `**.supabase.co`

**Caching:** None detected. No Redis, no in-memory cache layer.

## Monitoring & Observability

**Error Tracking:** None configured. Errors logged via `console.error()` in cloud functions and `yuting/src/lib/trips.ts`.

**Logs:**
- Miniprogram: `console.error` in cloud functions
- Web app: `console.error` in `yuting/src/lib/trips.ts` for Supabase errors

## CI/CD & Deployment

**Hosting:**
- Miniprogram: WeChat platform (published via DevTools)
- Web app: Self-hostable on any Node.js/Vercel platform

**CI Pipeline:** None configured. No `.github/workflows/` directory found.

**Deployment Script:** `deploy.sh` — manual git push to `main` branch on `https://github.com/sy0310/couple-trip-map`

## Environment Configuration

**Required env vars (miniprogram):**
- `env` in `miniprogram/app.js:11` — WeChat Cloud environment ID (currently placeholder `your-env-id`)
- `appid` in `project.config.json:42` — WeChat App ID (currently placeholder `wx YOUR_APP_ID`)

**Required env vars (web app):**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `NEXT_PUBLIC_AMAP_KEY` (optional) — AMap JS API key
- `NEXT_PUBLIC_AMAP_SECURITY_CODE` (optional) — AMap security code

**Secrets location:**
- `yuting/.env.local` — gitignored, contains Supabase credentials
- `yuting/.env.example` — template with placeholder values

## Webhooks & Callbacks

**Incoming:** None detected.

**Outgoing:** None detected.

**Auth Callback:** `yuting/src/app/auth/callback/page.tsx` — Supabase auth redirect handler.

---

*Integration audit: 2026-04-27*
