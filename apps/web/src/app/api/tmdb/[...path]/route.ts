import { NextResponse } from "next/server";

import { tmdbRequestOptions } from "@/utils/fetch-apis";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// TMDB data changes slowly, so cache at the CDN rather than paying a TMDB
// round trip per app launch.
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

/**
 * Only these TMDB paths can be reached through the proxy. Without an
 * allowlist this route would forward anything to TMDB on our token, letting
 * a stranger spend our rate limit. Each entry is matched against the full
 * joined path, so `\d+` keeps ids numeric.
 */
const ALLOWED_PATHS = [
  /^movie\/\d+$/,
  /^movie\/\d+\/credits$/,
  /^movie\/\d+\/videos$/,
  /^movie\/(now_playing|upcoming|popular)$/,
  /^discover\/movie$/,
  /^trending\/(movie|tv)\/(day|week)$/,
  /^tv\/\d+$/,
  /^tv\/\d+\/credits$/,
  /^tv\/\d+\/videos$/,
  /^tv\/\d+\/season\/\d+$/,
  /^tv\/(on_the_air|airing_today|popular)$/,
  /^search\/(movie|tv|multi)$/,
  /^person\/\d+$/,
  /^person\/\d+\/movie_credits$/,
];

/** Query params worth forwarding. Anything else is dropped. */
const ALLOWED_PARAMS = [
  "language",
  "page",
  "region",
  "query",
  "include_adult",
  // discover/movie filters, for the home release rows
  "release_date.gte",
  "release_date.lte",
  "sort_by",
  "with_release_type",
];

/**
 * Generic read-only TMDB proxy.
 *
 * Exists so clients that can't hold a secret — the Expo app above all, where
 * any bundled value is extractable from the shipped binary — can read TMDB
 * without a token of their own. The token stays here on the server.
 *
 * Returns TMDB's JSON untouched so `createTmdbClient` in packages/shared can
 * point `baseUrl` at this route and otherwise behave exactly as it does when
 * talking to TMDB directly.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (!BASE_URL) {
    return NextResponse.json({ error: "TMDB is not configured" }, { status: 500 });
  }

  const { path } = await params;
  const joined = path.join("/");

  if (!ALLOWED_PATHS.some((allowed) => allowed.test(joined))) {
    return NextResponse.json({ error: "Unsupported path" }, { status: 404 });
  }

  const requested = new URL(request.url).searchParams;
  const forwarded = new URLSearchParams();
  for (const name of ALLOWED_PARAMS) {
    const value = requested.get(name);
    if (value !== null) forwarded.set(name, value);
  }

  const query = forwarded.toString();
  const url = `${BASE_URL}/${joined}${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(url, tmdbRequestOptions());

    if (!response.ok) {
      console.error(
        `TMDB request failed: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: "Upstream request failed" },
        { status: 502 }
      );
    }

    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  } catch (error) {
    console.error("TMDB fetch error:", error);
    return NextResponse.json({ error: "Upstream request failed" }, { status: 502 });
  }
}
