const PROBE_ORIGIN = "https://next.invalid";

/**
 * Where to send the user after sign-in, limited to paths on this site.
 *
 * A bare `startsWith("/")` check isn't enough: browsers read `//evil.com`,
 * `/\evil.com` and `/\t/evil.com` as links to another site, so a crafted
 * `?next=` would bounce a freshly signed-in user off to an attacker's page.
 * Resolving against a throwaway origin catches those spellings, because each
 * changes the resolved origin. The returned path is checked too: dot segments
 * survive the origin check and then normalize into a protocol-relative path
 * (`/.//evil.com` and `/a/..//evil.com` both resolve to `//evil.com`).
 */
/**
 * Where people land after signing in when nothing else was asked for.
 * Browse, not "/": the landing page is for visitors who don't know the app.
 */
const DEFAULT_AFTER_SIGN_IN = "/movies";

function safeNextPath(next: string | null | undefined): string {
  if (!next?.startsWith("/")) return DEFAULT_AFTER_SIGN_IN;

  try {
    const url = new URL(next, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return DEFAULT_AFTER_SIGN_IN;

    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path.startsWith("//") || path.startsWith("/\\")) {
      return DEFAULT_AFTER_SIGN_IN;
    }
    return path;
  } catch {
    return DEFAULT_AFTER_SIGN_IN;
  }
}

export { safeNextPath };
