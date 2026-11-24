"use client";

import { useEffect } from "react";

import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE_SECONDS,
  attributionFromParams,
} from "@/types";

/**
 * Remembers which link brought a visitor here (its utm_* tags) so sign-up
 * can record it on their profile (signup action, /auth/callback). First touch
 * wins: a cookie that's already set isn't overwritten, so the Reddit post
 * that introduced someone keeps the credit when they come back via Google.
 *
 * Runs in the browser after mount, so the root layout stays static. Renders
 * nothing. The cookie holds only the tags, never anything about the visitor.
 */
function AttributionCapture() {
  useEffect(() => {
    const tags = attributionFromParams(
      new URLSearchParams(window.location.search)
    );
    if (!tags) return;

    const alreadySet = document.cookie
      .split("; ")
      .some((entry) => entry.startsWith(`${ATTRIBUTION_COOKIE}=`));
    if (alreadySet) return;

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(
      JSON.stringify(tags)
    )}; Max-Age=${ATTRIBUTION_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  }, []);

  return null;
}

AttributionCapture.displayName = "AttributionCapture";

export { AttributionCapture };
