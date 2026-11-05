import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { requestPasswordReset } from "@/app/auth/actions";

export const metadata: Metadata = {
  description: "Get an email with a link to choose a new password.",
  title: "Forgot password",
};

interface Props {
  searchParams: Promise<{ error?: string; sent?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error, sent } = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-wide">
            Forgot password
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and we&apos;ll send you a link to choose a new
            password.
          </p>
        </div>

        {error && (
          <p
            className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
            role="alert"
          >
            {error}
          </p>
        )}
        {sent ? (
          <p
            className="bg-new-release/10 text-new-release rounded-md px-3 py-2 text-sm"
            role="status"
          >
            If there&apos;s an account for that email, a reset link is on its
            way. The link works once and expires after an hour. Check your spam
            folder if it doesn&apos;t arrive.
          </p>
        ) : (
          <form action={requestPasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </div>
            <Button className="w-full" type="submit">
              Send reset link
            </Button>
          </form>
        )}

        <p className="text-muted-foreground text-center text-sm">
          Remembered it?{" "}
          <Link className="underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
