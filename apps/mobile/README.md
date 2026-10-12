# Corner Video — Mobile

The Expo (iOS and Android) client. Browse movies and TV, search the TMDB catalog, keep a personal watchlist, and mark episodes watched.

Part of the [Corner Video monorepo](../../README.md); it shares a Supabase project and the TMDB client (`@moviewatchlist/shared`) with the [web app](../web/README.md), so an account created on either works on both.

## Features

- **Browse** — Trending and regional movie and TV listings
- **Search** — Full-text search across the TMDB catalog
- **Detail screens** — Movie and TV show details with cast and seasons
- **Episode tracking** — Season screens with per-episode watched state, including bulk actions
- **Accounts** — Sign-up and login via Supabase auth, with session persistence
- **Watchlist** — Save titles, filter by watch status, and update status inline

## Tech Stack

- [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/) with [Expo Router](https://docs.expo.dev/router/introduction) — file-based routing
- [React Native 0.85](https://reactnative.dev) / [React 19](https://react.dev)
- [NativeWind 4.2](https://www.nativewind.dev) — Tailwind CSS **v3** syntax for React Native
- [Supabase](https://supabase.com) — auth and Postgres, with AsyncStorage-backed sessions

## Getting Started

### Environment

Copy [`.env.example`](.env.example) to `.env` in this directory and fill it in:

```bash
cp .env.example .env
```

Use the **same Supabase project** as `apps/web/.env` so accounts are shared.

| Variable                        | Purpose                                     |
| ------------------------------- | ------------------------------------------- |
| `EXPO_PUBLIC_TMDB_PROXY_URL`    | The web app's `/api/tmdb` route — see below |
| `EXPO_PUBLIC_TMDB_IMAGE_PATH`   | TMDB image CDN base                         |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase project URL                        |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                           |

Every `EXPO_PUBLIC_*` value is inlined into the shipped bundle, where anyone can read it out of an `.ipa`/`.apk`. **Nothing secret belongs in this file** — which is why there is no TMDB token here. Reads go through the web app's proxy, which holds the token server-side.

That proxy has to be running: start the web app (`pnpm --filter @moviewatchlist/web dev`) before the mobile app, or point `EXPO_PUBLIC_TMDB_PROXY_URL` at a deployed instance.

### Choosing the proxy host

`localhost` is resolved by whatever runs the app, not by your machine, so the right host depends on the target:

| Target                                      | Host                                                                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| iOS simulator                               | `http://localhost:3000/api/tmdb` — shares the host's network stack                                                                                           |
| Android emulator                            | `http://10.0.2.2:3000/api/tmdb` — a VM with its own stack, so `localhost` is the emulator itself and the connection is refused (`10.0.3.2` under Genymotion) |
| Physical device, or one value for all three | `http://<your-LAN-IP>:3000/api/tmdb`, as printed by `next dev`                                                                                               |
| Deployed                                    | `https://<your-domain>/api/tmdb`                                                                                                                             |

Use `http://` against `next dev` — it serves no TLS, so an `https://` URL simply times out.

Expo inlines these at bundle time, so restart with `-c` after changing `.env`; editing the file alone will not reach a running app.

### Run the app

From the repo root:

```bash
pnpm --filter @moviewatchlist/mobile dev
```

Or from this directory: `pnpm dev`, `pnpm ios`, `pnpm android`. Add `-c` to clear the bundler cache after env changes:

```bash
pnpm --filter @moviewatchlist/mobile exec expo start -c
```

### Other commands

```bash
pnpm --filter @moviewatchlist/mobile lint
pnpm --filter @moviewatchlist/mobile exec tsc --noEmit
pnpm --filter @moviewatchlist/mobile exec expo export --platform ios   # full bundle check
```

From this directory, `pnpm dlx expo-doctor@latest` checks the Expo config and dependency versions.

## Project Structure

```
src/
├── app/                          # Expo Router routes (file-based)
│   ├── _layout.tsx               # Auth gate — redirects between (auth) and (app)
│   ├── (auth)/                   # login, signup
│   └── (app)/
│       ├── (tabs)/               # Browse, Search, Watchlist
│       ├── movie/[id].tsx        # Movie detail
│       └── tv/[id]/              # TV detail
│           └── season/[season]   # Season and episode tracking
├── components/
│   ├── poster-card.tsx
│   └── watchlist-button.tsx
├── lib/
│   ├── supabase.ts               # Supabase client (AsyncStorage-backed sessions)
│   ├── auth-context.tsx          # AuthProvider / useAuth
│   ├── tmdb.ts                   # Shared TMDB client, pointed at the proxy
│   ├── watchlist.ts, episodes.ts # User-data writes (RLS-scoped)
│   └── watch-status.ts
└── global.css                    # NativeWind entry
```

Route files use `export default` (an Expo Router requirement); other components use named exports with a `displayName`, per the root conventions.

## Notes

- **Read the versioned docs** at <https://docs.expo.dev/versions/v56.0.0/> — Expo changes fast.
- **NativeWind uses Tailwind v3**, not the v4 the web app uses. `className` works on React Native core components; third-party components (e.g. `expo-image`) need an explicit `style` or a `cssInterop` registration.
- **A flat `node_modules` is required.** The root `.npmrc` sets `node-linker=hoisted` and the root `package.json` pins a single React version. Metro breaks under pnpm's default symlinked layout or with duplicate React copies.
