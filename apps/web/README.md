# Corner Video — Web

The Next.js web client. Browse trending, now-playing and upcoming movies plus currently airing TV — filtered by region — search the TMDB catalog, keep a personal watchlist, and mark episodes watched.

Part of the [Corner Video monorepo](../../README.md); it shares a Supabase project and the TMDB client (`@moviewatchlist/shared`) with the [Expo app](../mobile/README.md), so accounts and data are the same on both.

## Features

- **Home page** — Trending hero banner, now-playing and upcoming movies, and currently airing TV, filtered by region
- **Region selection** — ISO 3166-1 country codes (US, CA, GB, etc.) for region-specific release dates
- **Search** — Full-text search across the TMDB catalog
- **Detail pages** — Poster, genres, rating, runtime, overview, directors, cast, and trailers, for movies and TV shows
- **Episode tracking** — Season pages with per-episode watched state
- **Accounts** — Sign-up, login, and a profile page, backed by Supabase auth
- **Watchlist** — Save titles and move them between watch statuses
- **Trailer playback** — Embedded YouTube trailers via a modal dialog
- **Dark/Light theme** — System-aware with manual toggle
- **Responsive design** — Mobile-first layout

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, Server Components)
- [React 19](https://react.dev)
- [Supabase](https://supabase.com) — authentication and Postgres
- [Tailwind CSS 4](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com) — headless component primitives
- [next-themes](https://github.com/pacocoursey/next-themes) — dark/light mode
- [Lucide React](https://lucide.dev) — icons
- [Playwright](https://playwright.dev) — end-to-end and accessibility testing

Movie and TV data is sourced from [The Movie Database (TMDB) API v3](https://developer.themoviedb.org).

## Getting Started

### Environment

Copy [`.env.example`](.env.example) to `.env` in this directory and fill it in:

```bash
cp .env.example .env
```

| Variable                        | Purpose                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `TMDB_API_KEY`                  | TMDB read access token. **Server-only**                                      |
| `NEXT_PUBLIC_API_URL`           | TMDB API base URL                                                            |
| `NEXT_PUBLIC_API_IMAGE_PATH`    | TMDB image CDN base                                                          |
| `NEXT_PUBLIC_SITE_URL`          | Absolute site URL, used for `metadataBase` and canonicals. No trailing slash |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                                                            |

A free TMDB read access token comes from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api). Use the long **API Read Access Token**, not the short v3 API key — it is sent as a bearer token. Store it on its own: the `Bearer ` prefix is added in code.

`TMDB_API_KEY` is deliberately not prefixed with `NEXT_PUBLIC_`. It is read only on the server, and browser requests reach TMDB through the route handlers in `src/app/api`. Anything prefixed `NEXT_PUBLIC_` is inlined into the client bundle, so no secret belongs there.

> Use `.env` rather than `.env.local`. Next.js reads either, but `playwright.config.ts` loads `.env` specifically — put values only in `.env.local` and the metadata tests will compare against `undefined`.

Supabase credentials are required even for browsing: `src/proxy.ts` refreshes the session on every page request and will fail without them.

### Run the development server

From the repo root:

```bash
pnpm --filter @moviewatchlist/web dev
```

Or from this directory, `pnpm dev`. Open [http://localhost:3000](http://localhost:3000).

### Other commands

```bash
pnpm --filter @moviewatchlist/web build
pnpm --filter @moviewatchlist/web lint
pnpm --filter @moviewatchlist/web exec playwright test    # E2E + accessibility
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout (Header, Footer, providers)
│   ├── page.tsx              # Home page
│   ├── not-found.tsx         # Custom 404 page
│   ├── api/                  # Route handlers — TMDB reads for client components
│   ├── auth/                 # Auth actions and OAuth/email-confirm callback
│   ├── login/, signup/       # Auth pages
│   ├── profile/              # User profile (protected)
│   ├── watchlist/            # User watchlist (protected)
│   ├── search/               # Search results page
│   ├── movies/[id]/          # Movie detail page
│   ├── tv/[id]/              # TV detail page
│   │   └── season/[season]/  # Season and episode tracking
│   └── cast-and-crew/[id]/   # Person detail page
├── components/
│   ├── movies/, tv/, media/  # Fetchers, lists, previews
│   ├── episodes/             # Episode list and watched toggles
│   ├── watchlist/            # Add/remove/status controls
│   ├── header/, footer/      # Search, RegionSelect, ModeToggle, Logo
│   ├── hero/, home/          # Hero banner and home sections
│   ├── skeletons/            # Loading skeletons
│   └── ui/                   # Radix-based Button, Card, Dialog, etc.
├── data/
│   ├── loaders.ts            # TMDB movie/person loaders (server-only)
│   ├── tv-loaders.ts         # TMDB TV loaders (server-only)
│   └── client-loaders.ts     # Browser-side counterparts, via /api
├── lib/
│   ├── actions/              # Server actions — watchlist, episodes, profile
│   ├── supabase/             # Browser and server clients
│   └── region-context.tsx    # Global region selection state
├── utils/
│   └── fetch-apis.ts         # Generic fetch utilities with error handling
└── proxy.ts                  # Session refresh + protected-route redirects
```
