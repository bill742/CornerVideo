## Corner Video

Your neighbourhood video store, minus the late fees. A cross-platform app for browsing movies and TV shows, tracking a personal watchlist, and marking episodes watched. The web and mobile clients share a single Supabase project and a single TMDB client, so accounts and data are the same on both.

## Current Features

- **Trending & regional releases** — Hero banner of trending titles, now-playing and upcoming movies, and currently airing TV, filtered by country (US, CA, GB, and more)
- **Search** — Full-text search across the TMDB catalog
- **Detail pages** — Poster, genres, rating, runtime, overview, directors, cast, and trailers, for both movies and TV shows
- **Accounts** — Sign-up, login, and a user profile
- **Watchlist** — Save titles and move them between watch statuses
- **Episode tracking** — Season-by-season view with per-episode watched state
- **Mobile app** — Expo client with the same browse, search, watchlist, and episode tracking
- **Trailer playback** — Embedded YouTube trailers via an in-page modal
- **Dark/Light theme** — System-aware with a manual toggle
- **Responsive design** — Mobile-first layout

## Tech Stack

- [Turborepo](https://turborepo.com) + [pnpm](https://pnpm.io) workspaces — monorepo tooling
- [Next.js](https://nextjs.org) (App Router, Server Components) — React 19 web app
- [Expo](https://expo.dev) (Expo Router, React Native) — iOS and Android app
- [Supabase](https://supabase.com) — authentication and Postgres, shared by both clients
- [Tailwind CSS 4](https://tailwindcss.com) on web, [NativeWind](https://www.nativewind.dev) on mobile
- [Radix UI](https://www.radix-ui.com) — headless component primitives
- [Playwright](https://playwright.dev) — end-to-end and accessibility testing

Data is sourced from [The Movie Database (TMDB) API v3](https://developer.themoviedb.org).

## Project Structure

```
MovieWatchlist/
├── apps/
│   ├── web/          # Next.js web app (@moviewatchlist/web)
│   └── mobile/       # Expo app (@moviewatchlist/mobile)
├── packages/
│   └── shared/       # @moviewatchlist/shared — types, constants, TMDB client
└── supabase/
    └── migrations/   # schema, RLS policies, triggers
```

## Getting Started

Node is pinned in `.node-version` and pnpm in the root `package.json`'s `packageManager` field. Run these from the repo root — Turborepo fans each one out to the workspaces:

```bash
pnpm install
pnpm dev      # start dev servers
pnpm build
pnpm lint
```

For per-app setup and the environment variables each one needs, see
[`apps/web/README.md`](apps/web/README.md) and [`apps/mobile/README.md`](apps/mobile/README.md).

## Upcoming Features

- **Push notifications** — Mobile alerts for new episodes and releases
- **App store releases** — EAS Build and store submission
- **Premium tier** — Stripe on web, RevenueCat on mobile
- **Trakt sync** — Import and sync watch history
