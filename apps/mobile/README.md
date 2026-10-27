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

Or pull the preview values from EAS into a gitignored `.env.local`. They point at the deployed proxy, so the web app doesn't need to be running:

```bash
eas env:pull --environment preview
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

**Android needs a development build, not Expo Go.** Since SDK 53, Expo Go for Android throws as soon as `expo-notifications` loads, and New release alerts use it. Build the dev client once with `eas build --platform android --profile development`, install the APK on the emulator or device, then open it while `expo start` is running. JS changes load from Metro; rebuild only when native dependencies change. Expo Go still works on iOS.

### Other commands

```bash
pnpm --filter @moviewatchlist/mobile lint
pnpm --filter @moviewatchlist/mobile exec tsc --noEmit
pnpm --filter @moviewatchlist/mobile exec expo export --platform ios   # full bundle check
```

From this directory, `pnpm dlx expo-doctor@latest` checks the Expo config and dependency versions.

## Builds and releases (EAS)

Native binaries are built with [EAS Build](https://docs.expo.dev/build/introduction/) and uploaded with EAS Submit. The project uses Continuous Native Generation: `ios/` and `android/` are gitignored and generated on the build server from `app.json`.

| Identifier            | Value             |
| --------------------- | ----------------- |
| iOS bundle identifier | `app.cornervideo` |
| Android package       | `app.cornervideo` |
| URL scheme            | `cornervideo`     |

Both identifiers are permanent once a build reaches either store. Don't change them.

### Profiles (`eas.json`)

| Profile                 | Output                                                     | EAS environment |
| ----------------------- | ---------------------------------------------------------- | --------------- |
| `development`           | Dev client (`expo-dev-client`): iOS simulator, Android APK | `development`   |
| `development-simulator` | Dev client for the iOS Simulator only                      | `development`   |
| `preview`               | Internal-distribution build: ad hoc iOS, Android APK       | `preview`       |
| `production`            | Store build: TestFlight `.ipa`, Play `.aab`                | `production`    |

`development-simulator` builds the same iOS Simulator dev client as `development`, under a name that says what it targets. Use it with `--platform ios`:

```bash
eas build --profile development-simulator --platform ios
```

When the build finishes, the EAS CLI offers to install it on a booted Simulator. Then run `expo start` and open the app. As with `development`, rebuild only when native dependencies change.

All four extend `base`, which pins Node and pnpm to the repo's versions. Build numbers are managed remotely (`appVersionSource: "remote"`) and `production` auto-increments them. Bump `expo.version` in `app.json` for a new marketing version.

### Environment variables

`.env` is gitignored, so it never reaches the build server. Builds read their `EXPO_PUBLIC_*` values from EAS environments instead. None of these values are secret (they ship in the binary), so use `plaintext` or `sensitive` visibility, never `secret`:

```bash
eas env:set --environment preview --environment production --visibility plaintext \
  --name EXPO_PUBLIC_TMDB_PROXY_URL --value https://cornervideo.app/api/tmdb
eas env:set --environment preview --environment production --visibility plaintext \
  --name EXPO_PUBLIC_TMDB_IMAGE_PATH --value https://image.tmdb.org/t/p/
# The Supabase values are read from the web app's .env (same project, shared accounts)
eas env:set --environment preview --environment production --visibility plaintext \
  --name EXPO_PUBLIC_SUPABASE_URL \
  --value "$(grep '^NEXT_PUBLIC_SUPABASE_URL=' ../web/.env | cut -d= -f2- | tr -d '"')"
eas env:set --environment preview --environment production --visibility sensitive \
  --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' ../web/.env | cut -d= -f2- | tr -d '"')"
```

Run these from `apps/mobile`. Then check them with `eas env:list --environment production`.

Development builds don't need these, because a dev client loads its JS from your local `expo start`, which reads `.env`.

### One-time setup

Run from this directory, with `eas-cli` installed (`npm i -g eas-cli`):

1. `eas login`. The EAS project already exists ([`@bill742/corner-video`](https://expo.dev/accounts/bill742/projects/corner-video)) and is linked by `extra.eas.projectId` and `owner` in `app.json`. Don't run `eas init` again.
2. Create the environment variables above.
3. **iOS:** create the app in App Store Connect with bundle ID `app.cornervideo`. The first `eas build --platform ios` offers to generate the distribution certificate and provisioning profile.
4. **Android:** create the app in the Play Console. Google's API can't upload to an app with no releases, so upload the first `.aab` from `eas build --platform android --profile production` by hand to the Internal testing track. Then create a Google service account key and add it to the project with `eas credentials` so EAS Submit can upload later builds.

### Shipping a beta

```bash
eas build --platform all --profile production
eas submit --platform ios --latest       # TestFlight
eas submit --platform android --latest   # Play internal track, as a draft release
```

Android submissions go up as **drafts** (`releaseStatus: "draft"`), which Play requires until the app has its first published release. Roll each draft out to internal testers in the Play Console. Once the app is past review, switch it to `completed` in `eas.json`.

Use `eas build --profile preview` for a quick installable build on registered devices without going through the stores.

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
- **A flat `node_modules` is required.** The root `pnpm-workspace.yaml` sets `nodeLinker: hoisted` and pins a single React version via `overrides`. Metro breaks under pnpm's default symlinked layout or with duplicate React copies.
