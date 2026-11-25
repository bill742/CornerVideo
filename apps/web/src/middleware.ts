import { type NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

/**
 * `middleware.ts`, deliberately, not Next 16's `proxy.ts`.
 *
 * Two constraints meet here. Next 16 renamed this file to `proxy.ts` and pinned
 * it to the Node runtime with no way to configure it, while the OpenNext
 * Cloudflare adapter supports only edge middleware and fails the build on the
 * Node kind. Next 16 still honours `middleware.ts` for exactly this case, so
 * the deprecated filename is the one that works on Workers.
 *
 * Deleting it outright is not an option: `@supabase/ssr` needs a middleware to
 * refresh the access token, because Server Components cannot write cookies. Do
 * that and a signed-in visitor whose token has expired is bounced to /login by
 * the very pages that should have refreshed them.
 *
 * Revisit when Next ships edge-runtime support for `proxy`.
 */
const PROTECTED_PATHS = ["/watchlist", "/profile"];

/**
 * How long we will wait on Supabase before treating the request as signed out.
 *
 * When the auth host is unreachable, gotrue retries with exponential backoff
 * for ~26s before surfacing AuthRetryableFetchError — and this runs on every
 * request carrying a session cookie, so a Supabase outage otherwise turns into
 * ~51s page loads for every signed-in user. Generous enough that an ordinarily
 * slow response still succeeds rather than signing people out.
 */
const AUTH_TIMEOUT_MS = 5000;

/**
 * Resolves `work`, or falls back if it hasn't settled within the timeout.
 *
 * The abort signal on the Supabase client cancels the in-flight request so we
 * don't leave a socket open; this race is the hard bound, since gotrue retries
 * internally and would otherwise keep going long after the first attempt was
 * cancelled.
 */
async function withinTimeout<T>(work: Promise<T>, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), AUTH_TIMEOUT_MS);
  });

  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * True when the request carries a Supabase session cookie (`sb-<ref>-auth-token`,
 * possibly split into `.0`, `.1`… chunks). Presence only: nothing is verified.
 */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

export async function middleware(request: NextRequest) {
  // The landing page is for people who don't know the app yet. Members go
  // straight to Browse. This is a routing hint, not an auth check, so it
  // skips getUser() — no Supabase round trip, almost no CPU on the Workers
  // free plan. A stale cookie just lands someone on /movies signed out,
  // which is a fine place to be.
  if (request.nextUrl.pathname === "/") {
    if (!hasSessionCookie(request)) return NextResponse.next();
    const browse = request.nextUrl.clone();
    browse.pathname = "/movies";
    return NextResponse.redirect(browse);
  }

  let response = NextResponse.next({ request });

  // Refresh the Supabase session on every request so it never expires silently.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, options, value }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
          }),
      },
    }
  );

  const user = await withinTimeout(
    supabase.auth
      .getUser()
      .then(({ data }) => data.user)
      .catch(() => null),
    null
  );

  const isProtected = PROTECTED_PATHS.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Allowlisted rather than excluded. This previously matched nearly every
  // request, so each page view — including anonymous and crawler traffic on
  // fully public pages — cost an edge invocation, and any request carrying a
  // session cookie also cost a Supabase round trip. Only the gated routes and
  // the sign-in callback actually need this to run.
  //
  // The tradeoff: a signed-in user browsing only public pages no longer gets a
  // server-side session refresh. supabase-js refreshes in the browser, and the
  // refresh still happens the moment they touch a protected route, so the
  // session outliving its access token is not a practical concern.
  //
  // "/" only checks for a session cookie and never calls Supabase; see the
  // top of middleware().
  matcher: ["/", "/watchlist/:path*", "/profile/:path*", "/auth/callback"],
};
