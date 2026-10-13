const PROBE_ORIGIN = "https://next.invalid";

/**
 * Where to send the user after sign-in, limited to paths on this site.
 *
 * A bare `startsWith("/")` check isn't enough: browsers read `//evil.com`,
 * `/\evil.com` and `/\t/evil.com` as links to another site, so a crafted
 * `?next=` would bounce a freshly signed-in user off to an attacker's page.
 * Resolving against a throwaway origin catches every one of those spellings,
 * because any of them changes the resolved origin.
 */
function safeNextPath(next: string | null | undefined): string {
  if (!next?.startsWith("/")) return "/";

  try {
    const url = new URL(next, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export { safeNextPath };
