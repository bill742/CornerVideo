import type { Metadata } from "next";
import Link from "next/link";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { resetPassword } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  description: "Choose a new password for your account.",
  // Reset links carry a one-time token in the URL.
  referrer: "no-referrer",
  robots: { follow: false, index: false },
  title: "Reset password",
};

interface Props {
  searchParams: Promise<{
    error?: string;
    token_hash?: string;
  }>;
}

/**
 * Where the reset email lands, from either app. The token is only checked
 * when the form is submitted (see resetPassword), so a mail scanner opening
 * this page doesn't use it up.
 */
export default async function ResetPasswordPage({ searchParams }: Props) {
  const { error, token_hash: tokenHash } = await searchParams;

  // No token: only someone already signed in can set a password here — the
  // retry after a rejected password, once the token has been spent.
  const signedIn =
    !tokenHash && !!(await (await createClient()).auth.getUser()).data.user;

  if (!tokenHash && !signedIn) {
    return (
      <ResetLayout>
        <p
          className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
          role="alert"
        >
          This reset link is incomplete or has expired. Send yourself a new one.
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Send a new link</Link>
        </Button>
      </ResetLayout>
    );
  }

  return (
    <ResetLayout>
      {error && (
        <p
          className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
          role="alert"
        >
          {error}
        </p>
      )}
      <form action={resetPassword} className="space-y-4">
        {tokenHash && (
          <input name="token_hash" type="hidden" value={tokenHash} />
        )}
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            autoComplete="new-password"
            id="password"
            minLength={8}
            name="password"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <PasswordInput
            autoComplete="new-password"
            id="confirm"
            minLength={8}
            name="confirm"
            required
          />
        </div>
        <Button className="w-full" type="submit">
          Change password
        </Button>
      </form>
    </ResetLayout>
  );
}

function ResetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-wide">
            Reset password
          </h1>
          <p className="text-muted-foreground text-sm">
            Choose a new password for your account.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
ResetLayout.displayName = "ResetLayout";
