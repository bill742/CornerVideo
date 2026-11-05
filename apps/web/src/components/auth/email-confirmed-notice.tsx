"use client";

import { useEffect, useState } from "react";

import { CircleCheck, X } from "lucide-react";

const VISIBLE_MS = 10_000;

/**
 * The toast after a "Confirm signup" link: /auth/confirm redirects to
 * `/login?confirmed=1`. It lives in the root layout and reads the flag in the
 * browser, so it works on any page without making it dynamic.
 *
 * The flag is dropped from the address straight away, so a reload or a
 * bookmark doesn't show it again. The live region is rendered empty first and
 * filled after mount, which is what makes screen readers announce it.
 */
function EmailConfirmedNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("confirmed") !== "1") return;

    url.searchParams.delete("confirmed");
    window.history.replaceState(window.history.state, "", url);
    // Reading the address is only possible after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      aria-live="polite"
      id="email-confirmed-notice"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      role="status"
    >
      {visible && (
        <div className="bg-background text-foreground border-border pointer-events-auto flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 shadow-lg">
          <CircleCheck
            aria-hidden="true"
            className="text-new-release mt-0.5 size-5 shrink-0"
          />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Your email is confirmed.</p>
            {/* TODO(app launch): mention the app again, e.g. "Sign in to get
                started, here or in the app." Left out while there's no app to
                point to. */}
            <p className="text-muted-foreground">Sign in to get started.</p>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground -mt-1 -mr-2 rounded p-1"
            onClick={() => setVisible(false)}
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
EmailConfirmedNotice.displayName = "EmailConfirmedNotice";

export { EmailConfirmedNotice };
