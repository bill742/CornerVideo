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
| `STRIPE_SECRET_KEY`             | Stripe secret key. **Server-only**; optional — unset hides Premium section   |
| `STRIPE_PRICE_MONTHLY`          | Stripe price ID for monthly Premium                                          |
| `STRIPE_PRICE_ANNUAL`           | Stripe price ID for annual Premium                                           |

A free TMDB read access token comes from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api). Use the long **API Read Access Token**, not the short v3 API key — it is sent as a bearer token. Store it on its own: the `Bearer ` prefix is added in code.

`TMDB_API_KEY` is deliberately not prefixed with `NEXT_PUBLIC_`. It is read only on the server, and browser requests reach TMDB through the route handlers in `src/app/api`. Anything prefixed `NEXT_PUBLIC_` is inlined into the client bundle, so no secret belongs there.

> Use `.env` rather than `.env.local`. Next.js reads either, but `playwright.config.ts` loads `.env` specifically — put values only in `.env.local` and the metadata tests will compare against `undefined`.

Supabase credentials are required: `src/middleware.ts` refreshes the session on `/watchlist`, `/profile` and `/auth/callback` and fails without them, and the header and sign-in pages use them too.

### Billing (Stripe)

Premium is sold on the web through Stripe Checkout, and members manage it in the Stripe billing portal. The web app only _starts_ those sessions (`src/lib/actions/billing.ts`). The `subscriptions` row is written by the `stripe-webhook` Supabase Edge Function (`supabase/functions/stripe-webhook`), never by the app, so a member can't grant themselves premium.

One-time setup, in **test mode** until the Worker moves to Workers Paid (PLAN.md Phase 4 step 5):

1. Apply `supabase/migrations/002_stripe_billing.sql` (SQL editor or `supabase db push`).
2. In Stripe, create a **Premium** product with a monthly and an annual recurring price. Put both price IDs and the secret key in `.env`.
3. Turn on the [customer portal](https://dashboard.stripe.com/test/settings/billing/portal) (cancel, switch plans between the two prices, update payment method).
4. Deploy the webhook (Supabase CLI, run from the repo root):

   ```bash
   supabase link --project-ref <project-ref>
   supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_...
   supabase functions deploy stripe-webhook   # verify_jwt = false comes from supabase/config.toml
   ```

5. Add a Stripe webhook endpoint at `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` for `checkout.session.completed` and `customer.subscription.created`, `.updated`, `.deleted`, `.paused`, `.resumed`. Its signing secret is `STRIPE_WEBHOOK_SECRET` above.
6. Production Worker: `wrangler secret put` each of `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_ANNUAL` — secrets, not vars, for the reason in `wrangler.jsonc`.

Locally, `stripe listen --forward-to https://<project-ref>.supabase.co/functions/v1/stripe-webhook` prints a `whsec_` to use instead, and test card `4242 4242 4242 4242` completes checkout.

### Account deletion

Members delete their own account from the Membership page (web) or Membership tab (mobile); App Review guideline 5.1.1(v) requires it in the app. Both call the `delete-account` Edge Function (`supabase/functions/delete-account`) with the member's session. It deletes their Stripe customer first (cancelling any web subscription; if that fails, nothing is deleted), then their RevenueCat subscriber, then the auth user, which cascades to every app table. App Store and Google Play subscriptions can't be cancelled from the server, so both screens tell the member to cancel those first.

Late Stripe and RevenueCat webhooks for a deleted member hit a foreign-key error on write; the webhooks acknowledge those (`_shared/deleted-member.ts`) instead of retrying.

Deploy it, and redeploy the functions that share the deleted-member check (it uses the `STRIPE_SECRET_KEY` and `REVENUECAT_SECRET_KEY` secrets already set for billing):

```bash
supabase functions deploy delete-account   # verify_jwt = false comes from supabase/config.toml
supabase functions deploy stripe-webhook
supabase functions deploy revenuecat-webhook
supabase functions deploy revenuecat-sync
```

### Email confirmation

New accounts confirm their email before signing in, from either app. The "Confirm signup" email links to `/auth/confirm`, which confirms the account with the link's one-time `token_hash` and sends the member to sign in, with a "Your email is confirmed" notice (`SiteNotice`). It deliberately signs nobody in: the link doesn't prove who opened it, so a session here would let someone send their own confirmation link to another person and leave them signed in to the sender's account. A link that has expired or was already used (a mail scanner may have opened it first, which still confirms the email) goes to `/login` with a message to sign in. Unlike the default link, it works on any device and for sign-ups from the mobile app.

One-time Supabase setup (needs the custom SMTP described under "Password reset" below): in **Authentication → Emails → Confirm signup**, replace the link in the template with

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
```

### Password reset

"Forgot password?" on the sign-in page (web and mobile) emails a link to `/reset-password` on the web app. Mobile has no reset screen of its own: the member sets the new password in the browser, then signs in to the app with it.

The link carries a one-time `token_hash`, which is checked only when the member submits the new password, never when the page loads. Some mail providers open links to scan them, and that would otherwise use the token up before the member clicked it. That also means the link works on any device, not just the one that asked for it.

One-time Supabase setup (dashboard → Authentication):

1. **Emails → SMTP Settings:** turn on custom SMTP. Supabase only lets you edit email templates with it, and its built-in mailer only delivers to members of the project's team, a few emails an hour. With [Resend](https://resend.com), verify the sending domain there, then use host `smtp.resend.com`, port `465`, username `resend`, an API key as the password, and a sender such as `no-reply@cornervideo.app`. Afterwards, raise **Rate Limits → emails sent per hour** from its low default.
2. **Emails → Reset password:** replace the link in the template with

   ```html
   <a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery">Reset password</a>
   ```

   The default template's link logs the member in through the URL fragment instead, which this app can't read.

3. **URL Configuration → Site URL** must be `https://cornervideo.app`. Reset links from local development therefore open production, which works because both use the same Supabase project.

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
└── middleware.ts             # Session refresh + protected-route redirects (gated routes only)
```
