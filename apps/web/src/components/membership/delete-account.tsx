"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Membership } from "@/lib/billing";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/types";

const CONFIRM_WORD = "DELETE";

const STORE_NAMES = {
  apple: "the App Store",
  google: "Google Play",
  test: "the Test Store",
} as const;

interface Props {
  storePlatform: Membership["storePlatform"];
}

/**
 * Deletes the member's account through the delete-account Edge Function,
 * called from the browser with their own session (as the mobile app does),
 * so nothing here runs on the Worker.
 *
 * After it succeeds the session is cleared locally — the user no longer
 * exists, so a global sign-out would fail — and a full page load to
 * "/?account=deleted" resets every client component and shows SiteNotice.
 *
 * Plain copy: the brand guide keeps settings and payments text joke-free.
 */
function DeleteAccount({ storePlatform }: Props) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const confirmed = confirmText.trim() === CONFIRM_WORD;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed || pending) return;

    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: invokeError } = await supabase.functions.invoke(
      "delete-account",
      { method: "POST" }
    );

    if (invokeError) {
      console.error("delete-account failed:", invokeError.message);
      setError(
        `We couldn't delete your account. Try again, or email ${BRAND.contactEmail} and we'll do it for you.`
      );
      setPending(false);
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/?account=deleted");
  }

  return (
    <section aria-labelledby="delete-account-heading" className="space-y-4">
      <h2 className="text-xl font-semibold" id="delete-account-heading">
        Delete account
      </h2>
      <div className="text-muted-foreground max-w-prose space-y-2 text-sm">
        <p>
          This permanently deletes your account, your shelf, your watched
          episodes and your settings. It can&apos;t be undone.
        </p>
        <p>
          A web Premium subscription is cancelled straight away, with no further
          charges.
        </p>
        {storePlatform === "apple" || storePlatform === "google" ? (
          <p className="text-foreground font-medium">
            Your Premium subscription through {STORE_NAMES[storePlatform]}{" "}
            isn&apos;t cancelled by deleting your account. Cancel it in your{" "}
            {storePlatform === "apple" ? "iPhone" : "Google Play"} subscription
            settings first, or it will keep renewing.
          </p>
        ) : null}
      </div>

      <form className="max-w-sm space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="delete-confirm">Type {CONFIRM_WORD} to confirm</Label>
          <Input
            autoCapitalize="characters"
            autoComplete="off"
            id="delete-confirm"
            onChange={(event) => setConfirmText(event.target.value)}
            spellCheck={false}
            value={confirmText}
          />
        </div>
        <Button
          aria-disabled={!confirmed || pending}
          disabled={!confirmed || pending}
          // The brand's rental-sticker red. shadcn's "destructive" variant
          // fades to 60% in dark mode, which fails contrast with its white text.
          type="submit"
        >
          {pending ? "Deleting…" : "Delete account"}
        </Button>
        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

DeleteAccount.displayName = "DeleteAccount";

export { DeleteAccount };
