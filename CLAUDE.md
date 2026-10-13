# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**Corner Video** (formerly the placeholder "MovieWatchlist", which survives in
package names, the repo folder and the Cloudflare Worker name) is a cross-platform product (web + mobile) for browsing
TMDB movie/TV data, tracking a personal watchlist, and marking episodes watched.
It is being built out per `PLAN.md` — **Phases 1 and 2 are complete** (monorepo,
Supabase auth + database, watchlist, TV shows). **Phase 3 (Expo mobile app) is in
progress**: the core app is built — auth plus a tabbed app (browse / search /
watchlist), movie & TV detail screens, and season/episode tracking, all sharing the
Supabase project and TMDB client with web (PLAN.md Phase 3 items 1–5), plus
premium-gated release-day reminders as local notifications (item 6). Still
outstanding: EAS Build/store submission (item 7). Payments and Trakt sync are future
phases. Read `PLAN.md` for the roadmap, schema rationale, and
the free/premium feature split.

## Brand

Follow the brand guide at `docs/corner-video-brand-guide.md` for any UI, copy or
naming work, and update the guide when a brand decision changes. The essentials:

- **Name and copy** come from `BRAND` in `packages/shared/src/brand.ts` — never
  hard-code "Corner Video" or the tagline. Canadian spelling (neighbourhood,
  theatre, colour). Page titles are bare (`"My Shelf"`); the root layout's title
  template appends `| Corner Video`.
- **Vocabulary** on visible labels: watchlist → **My Shelf**, add → **Add to
  shelf**, profile → **Membership**, premiere reminders → **New release alerts**,
  upcoming premieres → **Coming Soon**. Accessible names match the visible label
  (no generic-term `aria-label`/`accessibilityLabel` overrides) so voice-control
  users can say what they see (WCAG 2.5.3). Sign-in,
  errors, settings and payments copy stays plain — no video-store jokes there.
  "Staff Picks" is reserved for the future AI assistant.
- **Palette** is `BRAND_COLORS` (light + dark), mirrored as CSS variables in
  `apps/web/src/app/globals.css` and as NativeWind variables via
  `apps/mobile/src/lib/theme.ts` (`bg-bg`, `text-fg`, `bg-primary`, …; use
  `useBrand().colors` for props that take a raw colour). The light/dark/system choice
  is `profiles.theme`, shared by both apps; mobile applies it with
  `Appearance.setColorScheme` via `src/lib/appearance.ts` (cached in
  AsyncStorage for launch, re-synced from the profile after sign-in). No raw hex or
  `neutral-*`/`gray-*` classes in UI code.
- **Type:** Oswald (`font-display`) for titles, logo and shelf labels; Public Sans
  for web body text, platform font for mobile body text.
- **Motifs:** poster rows stand on a shelf (`.shelf-slot` on web, the plank in
  mobile `PosterCard`); `RentalSticker` (web) for short dates/states; the striped
  awning (`.awning`) tops the header.
- **Icons** are generated from one SVG by `node scripts/generate-brand-icons.mjs`
  (web favicon/manifest/apple icons and all Expo icons). Edit the script, not
  the PNGs.

## Monorepo layout

This is a **Turborepo + pnpm workspaces** monorepo (`pnpm@10.33.2`, pinned via
`packageManager`). Do not assume a single Next.js app at the root. Node is pinned to
**24.21.0** in `.node-version` (honored by fnm/nodenv/asdf — plain `nvm` users should
mirror it in their own setup).

```
MovieWatchlist/
├── apps/
│   ├── web/                  # Next.js 16 web app (@moviewatchlist/web)
│   └── mobile/               # Expo SDK 56 app (@moviewatchlist/mobile)
├── packages/
│   └── shared/              # @moviewatchlist/shared — TS types, constants, TMDB client
├── supabase/
│   └── migrations/          # SQL schema (RLS policies, triggers)
├── turbo.json               # task pipeline (build, lint, dev)
├── pnpm-workspace.yaml
└── PLAN.md                  # expansion roadmap
```

> **React Native needs a flat node_modules.** `pnpm-workspace.yaml` sets
> `nodeLinker: hoisted` and pins `react`/`react-dom` to `19.2.3` (the Expo SDK 56 /
> RN 0.85 tested version; web's `^19.0.0` is satisfied by it) via `overrides`, so the
> hoisted layout has exactly one React. These live in the workspace file, not
> `.npmrc` or `package.json#pnpm`, because pnpm 11 reads neither. Leave them in place —
> Metro breaks under pnpm's default symlinked layout or with duplicate React copies.

`packages/shared` exports domain types (`Movie`, `TVShow`, `Profile`,
`WatchlistItem`, `MediaType`, `WatchStatus`, …), constants (e.g.
`FREE_WATCHLIST_LIMIT`), and a **framework-agnostic TMDB client**
(`createTmdbClient({ baseUrl, bearerToken, imageBase })` in `src/tmdb/client.ts`) — no
React `cache()`, no `process.env` reads, so both apps can wire their own env vars. The
web app re-exports shared from `apps/web/src/types.ts`
(`export * from "@moviewatchlist/shared"`), so **`@/types` and `@moviewatchlist/shared`
are the same module.** Inside the web app, import from `@/types`; in mobile (and
shared code) import from `@moviewatchlist/shared` directly. New shared domain types go
in `packages/shared/src/types.ts`. (The web app still has its own `cache()`-wrapped
loaders in `src/data/*loaders.ts`; deduplicating them onto the shared client is
deferred, not done.)

## Commands

Run from the **repo root** (Turbo fans out to workspaces):

- `pnpm dev` — start dev servers (`turbo dev`)
- `pnpm build` — build all workspaces (`turbo build`)
- `pnpm lint` — lint all workspaces (`turbo lint`)
- `pnpm typecheck` — `tsc --noEmit` in every workspace (`turbo typecheck`)
- `pnpm react-doctor` — React Doctor scan of web and mobile (`turbo react-doctor
  --continue`; not `pnpm doctor`, which is pnpm's own built-in). Web skips build
  output and shadcn code via `apps/web/doctor.config.json`

Scoped to the web app:

- `pnpm --filter @moviewatchlist/web dev` — Next dev server (localhost:3000)
- `pnpm --filter @moviewatchlist/web build`
- `pnpm --filter @moviewatchlist/web lint` — `eslint`
- `pnpm --filter @moviewatchlist/web exec playwright test` — E2E + a11y tests

Scoped to the mobile app:

- `pnpm --filter @moviewatchlist/mobile dev` — Expo dev server (`expo start`)
- `pnpm --filter @moviewatchlist/mobile lint` — `expo lint`
- `pnpm --filter @moviewatchlist/mobile typecheck` — type-check
- `pnpm --filter @moviewatchlist/mobile exec expo export --platform ios` — full bundle
  check (compiles everything without a simulator)
- `pnpm dlx expo-doctor@latest` (from `apps/mobile`) — environment/config checks

`packages/shared`'s `lint` script is `tsc --noEmit` (type-check only).

## Mobile app (Expo)

`apps/mobile` is an **Expo SDK 56** app (Expo Router, React 19.2, RN 0.85,
TypeScript). Read the versioned docs at <https://docs.expo.dev/versions/v56.0.0/> —
Expo changes fast. Key facts:

- **Routing:** Expo Router with `src/app` as the route root. Auth gating lives in
  `src/app/_layout.tsx` (redirects between the `(auth)` and `(app)` route groups based
  on Supabase session). The `(app)` group is a Stack: `(app)/(tabs)` holds the
  Browse / Search / Watchlist tabs, and detail screens push over them
  (`(app)/movie/[id]`, `(app)/tv/[id]`, `(app)/tv/[id]/season/[season]`). Route files
  use `export default` (Expo Router requirement); detail screens set their own header
  via `<Stack.Screen options={{ ... }} />` rendered inside the screen.
- **Styling:** **NativeWind v4.2** (Tailwind **v3** — not v4 like web). Config in
  `babel.config.js` (`jsxImportSource: "nativewind"` + `nativewind/babel`),
  `metro.config.js` (`withNativeWind`, monorepo `watchFolders`/`nodeModulesPaths`),
  `tailwind.config.js`, and `src/global.css`. Use `className` on RN core components;
  third-party components (e.g. `expo-image`) need explicit `style` or a `cssInterop`
  registration — `className` isn't auto-applied to them.
- **Auth/data:** `src/lib/supabase.ts` (supabase-js + AsyncStorage, `EXPO_PUBLIC_*`
  env), `src/lib/auth-context.tsx` (`AuthProvider`/`useAuth`), `src/lib/tmdb.ts`
  (shared TMDB client wired to `EXPO_PUBLIC_TMDB_*`). User-data writes are plain
  client-side helpers — `src/lib/watchlist.ts` and `src/lib/episodes.ts` call the
  mobile Supabase client directly (RLS scopes rows; they mirror the web server actions
  but throw instead of `revalidatePath`). Env vars must be `EXPO_PUBLIC_` prefixed; copy
  values from `apps/web/.env` into `apps/mobile/.env` (same Supabase project = shared
  accounts). See `apps/mobile/.env.example`.
- **Release reminders:** `src/lib/reminders.ts` schedules _local_ notifications
  (`expo-notifications`) — no push server or push tokens. `syncReminders()` reads the
  watchlist, looks up each title's next date on TMDB, and replaces every scheduled
  reminder (ids prefixed `release:`, capped at 60 for iOS's 64-pending limit). It runs
  on launch/foreground (`(app)/_layout.tsx`) and after watchlist writes; call it after
  any new watchlist mutation. Gated by `isPremium()` (`src/lib/premium.ts`, reads the
  `subscriptions` table) plus a per-device on/off flag in AsyncStorage.
- **TMDB reads:** the shared `createTmdbClient` (`packages/shared/src/tmdb/client.ts`)
  is the single source for both apps — it now covers movies, TV, season detail, credits,
  and multi-search. Add new TMDB endpoints there, not in app-local code.

## Web app tech stack

- **Next.js 16** (App Router) + **React 19**, TypeScript strict mode
- **Tailwind CSS v4** via `@tailwindcss/postcss` (no `tailwind.config.js`; tokens
  are CSS variables in `src/app/globals.css`)
- **shadcn/ui** (new-york style, neutral base) over Radix primitives; **Lucide** icons
- **next-themes** for light/dark/system theming
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) for auth + Postgres
- **Playwright** (+ `@axe-core/playwright`) for E2E and accessibility tests
- **Data source:** TMDB API

> Next.js 16 note: there is **no request middleware**. Next 16 renamed
> `middleware.ts` to `proxy.ts` and pinned it to the Node runtime with no way to
> configure it, while the OpenNext Cloudflare adapter supports only edge
> middleware — so `src/proxy.ts` was removed on the move to Cloudflare. Protected
> routes call `requireUser()` from `src/lib/auth.ts` instead. A new protected
> route must call it itself; nothing gates routes globally any more.

## Web directory structure

```
apps/web/src/
├── app/                     # App Router routes
│   ├── layout.tsx           # Root layout: ThemeProvider + RegionProvider + Header/Footer
│   ├── page.tsx             # Home (browse)
│   ├── auth/
│   │   ├── actions.ts       # login / signup / signout server actions
│   │   └── callback/route.ts# OAuth + email-confirm callback
│   ├── login/, signup/      # auth pages
│   ├── profile/             # user profile (protected)
│   ├── watchlist/           # user watchlist (protected)
│   ├── movies/[id]/         # movie detail
│   ├── tv/[id]/             # TV detail
│   │   └── season/[season]/ # season + episode tracking
│   ├── cast-and-crew/[id]/  # person detail
│   └── search/              # search (client-driven)
├── components/
│   ├── ui/                  # shadcn primitives — NOT linted (ignored in eslint config)
│   ├── auth/, header/, footer/, hero/, home/
│   ├── media/, movies/, tv/, episodes/
│   ├── watchlist/           # add/remove/status-select buttons
│   └── brand/               # brand motifs: RentalSticker, VhsLoader
├── data/
│   ├── loaders.ts           # TMDB movie/person loaders
│   └── tv-loaders.ts        # TMDB TV loaders
├── lib/
│   ├── actions/             # server actions: watchlist.ts, episodes.ts, profile.ts
│   ├── supabase/            # client.ts (browser), server.ts (RSC/actions)
│   ├── region-context.tsx   # client region context
│   └── utils.ts             # cn() etc.
├── utils/fetch-apis.ts      # generic TMDB fetch helpers (fetchAPI, fetchAPIList)
├── types.ts                 # re-exports @moviewatchlist/shared
└── lib/auth.ts              # requireUser() — per-page protected-route redirect
```

## Data & mutations

There are two distinct paths — keep them separate:

**1. TMDB reads → loaders (`src/data/*loaders.ts`).** All TMDB calls go through
`cache()`-wrapped loader functions that call `fetchAPI` / `fetchAPIList`. Loaders
**return `null` on failure (never throw)** and check `BASE_URL` before fetching.
Never `fetch` TMDB directly from a component.

```ts
export const getMovie = cache(async (id: string): Promise<Movie | null> => {
  if (!BASE_URL) return null;
  return fetchAPI<Movie>(`${BASE_URL}/movie/${id}?language=en-US`);
});
```

**2. User data writes → Supabase server actions (`src/lib/actions/*`).** Mutations
are `"use server"` functions that authenticate via `supabase.auth.getUser()`, write
through the server client, then `revalidatePath(...)`. They **throw** on error (the
opposite of loaders) so callers can surface the message. The free-tier limit
(`FREE_WATCHLIST_LIMIT`) is enforced in `addToWatchlist`; a real premium check is
still a TODO.

### Supabase clients

- `@/lib/supabase/server` — `createClient()` for RSC, server actions, and route
  handlers (async; reads/writes cookies via `next/headers`).
- `@/lib/supabase/client` — `createClient()` for client components (browser).
- `requireUser(nextPath)` from `@/lib/auth` redirects to `/login?next=…` unless a
  session is present. `/watchlist` and `/profile` call it as their first
  statement. There is no global session refresh — supabase-js handles refresh in
  the browser.

The database schema, RLS policies, and the `handle_new_user` trigger (auto-creates a
`profiles` row per auth user) live in `supabase/migrations/`.

## Environment variables

Defined in `apps/web/.env` (see `.env.example`):

- `TMDB_API_KEY` — TMDB read access token, server-only, bare token (no `Bearer ` prefix)
- `NEXT_PUBLIC_API_URL` — TMDB base URL
- `NEXT_PUBLIC_API_IMAGE_PATH` — TMDB image base
- `NEXT_PUBLIC_SITE_URL` (the brand name is `BRAND.name` in `@moviewatchlist/shared`, not an env var)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The TMDB token no longer reaches the browser. `src/data/loaders.ts`,
`src/data/tv-loaders.ts`, and `src/utils/fetch-apis.ts` all `import "server-only"`, so
importing them from a `"use client"` component is a build error. Client components use
`src/data/client-loaders.ts`, which calls the route handlers under `src/app/api`. When
adding a loader a client component needs, add the route handler and the
`client-loaders.ts` wrapper alongside it.

## Component conventions

- **Server Components by default.** Add `"use client"` only for hooks, event handlers,
  browser APIs, or client-only libraries.
- **Files/folders:** kebab-case. **Components:** PascalCase.
- **Exports go at the bottom of the file**, not inline on the declaration. Declare the
  component, set its `displayName` for DevTools/debugging, then export it:

  ```tsx
  function ComponentName() {
    return <div>...</div>;
  }
  ComponentName.displayName = "ComponentName";

  export { ComponentName };
  ```

  Prefer named exports over default exports. Always set
  `ComponentName.displayName = "ComponentName"` (not just for `memo`/`forwardRef`
  wrappers) so components are identifiable in React DevTools and error traces.

  **Exception — Next.js route-segment files** (`page.tsx`, `layout.tsx`,
  `loading.tsx`, `not-found.tsx`, `error.tsx`, `route.ts`, etc.) **must use
  `export default`** per App Router requirements; the named-export rule does not
  apply there (`displayName` is also unnecessary since they aren't reused).
  `components/ui/**` is generated shadcn code and is exempt from these conventions
  (it is also excluded from linting).

- **Hydration:** root `<html>` has `suppressHydrationWarning` for theming; use a
  `mounted` gate for theme-dependent client rendering.
- **Loading:** use `VhsLoader` (`@/components/brand/vhs-loader`) — in route
  `loading.tsx` files and for client-side loading states. Keep the page's heading
  rendered and swap only the content area, so nothing above it moves. No
  skeletons and no hand-rolled spinners. Mobile has a matching `VhsLoader`
  (`apps/mobile/src/components/vhs-loader.tsx`, Views + Reanimated) for
  full-screen loads; small inline spinners there stay as `ActivityIndicator`.
- **Images:** always `next/image`; remote hosts are configured in `next.config.ts`
  (`image.tmdb.org`). `next.config.ts` also sets `turbopack.root`/`outputFileTracingRoot`
  to the monorepo root — leave those as `path.join(__dirname, "../..")`.
- **Routing:** App Router APIs only (`next/navigation`); never Pages Router
  (`next/router`, `getServerSideProps`, `getStaticProps`).
- All UI must support light/dark mode and meet accessibility expectations (semantic
  HTML, labels, keyboard nav) — there are axe-core tests guarding this.

## Linting & formatting (important, will fail CI/commits)

ESLint is **v10 flat config** (`apps/web/eslint.config.mjs`). Two rules surprise
people:

- **`sort-keys-fix`** — object literal keys must be in **ascending alphabetical order**
  (case-sensitive). This is why server actions write e.g.
  `{ media_type, status, tmdb_id, user_id }` rather than logical order.
- **`sort-destructure-keys`** — destructured keys must also be alphabetical.
- `no-console` warns except `console.warn`/`console.error`.
- `src/components/ui/**` is ignored (generated shadcn code).

**Import ordering is handled by Prettier**, not ESLint (the `simple-import-sort` rules
are intentionally off). The order is set in `.prettierrc.json` via
`@trivago/prettier-plugin-sort-imports`: `react` → `next` → third-party →
`@/components/*` → `@/*` → relative, with blank lines between groups. Tailwind class
order is auto-sorted by `prettier-plugin-tailwindcss`. Run Prettier to fix import/class
order rather than hand-arranging.

## Testing

Playwright E2E + accessibility specs live in `apps/web/tests/` (`*.spec.ts`, including
`*-metadata-accessibility.spec.ts` that assert metadata and run axe checks). The config
auto-starts the dev server (`reuseExistingServer` locally) and runs Chromium, Firefox,
and WebKit. Add tests for new routes covering rendering, navigation, metadata, and a11y.

## When working with libraries

Per the user's global rule, use the **Context7 MCP** to fetch current docs for
libraries/frameworks/APIs (Next.js 16, React 19, Supabase, Tailwind v4, Playwright,
shadcn, etc.) rather than relying on memory — these are fast-moving and recently
upgraded here.
