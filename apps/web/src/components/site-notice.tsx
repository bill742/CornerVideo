"use client";

import { useEffect, useState } from "react";

import { CircleCheck, X } from "lucide-react";

const VISIBLE_MS = 10_000;

/**
 * One-time notices, keyed by a query flag a redirect adds. Each entry names
 * the flag and the value that shows it.
 */
const NOTICES = [
  {
    // /auth/confirm redirects to /login?confirmed=1 after a "Confirm signup"
    // link.
    body: "Sign in to get started.",
    // TODO(app launch): mention the app again, e.g. "Sign in to get started,
    // here or in the app." Left out while there's no app to point to.
    param: "confirmed",
    title: "Your email is confirmed.",
    value: "1",
  },
  {
    // DeleteAccount on the Membership page sends the member to
    // /?account=deleted once delete-account has removed them.
    body: "Everything on your shelf has been removed. Thanks for stopping by.",
    param: "account",
    title: "Your account has been deleted.",
    value: "deleted",
  },
] as const;

type Notice = (typeof NOTICES)[number];

/**
 * The toast for those flags. It lives in the root layout and reads the flag
 * in the browser, so it works on any page without making it dynamic.
 *
 * The flag is dropped from the address straight away, so a reload or a
 * bookmark doesn't show it again. The live region is rendered empty first and
 * filled after mount, which is what makes screen readers announce it.
 */
function SiteNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const match = NOTICES.find(
      ({ param, value }) => url.searchParams.get(param) === value
    );
    if (!match) return;

    url.searchParams.delete(match.param);
    window.history.replaceState(window.history.state, "", url);
    // Reading the address is only possible after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotice(match);

    const timer = setTimeout(() => setNotice(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      aria-live="polite"
      id="site-notice"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      role="status"
    >
      {notice && (
        <div className="bg-background text-foreground border-border pointer-events-auto flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 shadow-lg">
          <CircleCheck
            aria-hidden="true"
            className="text-new-release mt-0.5 size-5 shrink-0"
          />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">{notice.title}</p>
            <p className="text-muted-foreground">{notice.body}</p>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground -mt-1 -mr-2 rounded p-1"
            onClick={() => setNotice(null)}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      )}
    </div>
  );
}
SiteNotice.displayName = "SiteNotice";

export { SiteNotice };
