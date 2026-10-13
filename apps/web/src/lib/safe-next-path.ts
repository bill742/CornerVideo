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
function safeNextPath(next: string | null | undefined): string {
  if (!next?.startsWith("/")) return "/";

  try {
    const url = new URL(next, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return "/";

    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path.startsWith("//") || path.startsWith("/\\")) return "/";
    return path;
  } catch {
    return "/";
  }
}

export { safeNextPath };
