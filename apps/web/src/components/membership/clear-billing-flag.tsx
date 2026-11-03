"use client";

import { useEffect } from "react";

/**
 * Drops ?checkout= / ?billing= from the address once the notice has rendered,
 * so a reload or a bookmark doesn't show a stale "Checkout was cancelled" or
 * "Billing isn't available" again. replaceState leaves the rendered notice in
 * place and adds no history entry.
 */
function ClearBillingFlag() {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("billing");
    url.searchParams.delete("checkout");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  return null;
}

ClearBillingFlag.displayName = "ClearBillingFlag";

export { ClearBillingFlag };
