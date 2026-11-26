import type { Metadata } from "next";
import Link from "next/link";

import { ChevronDown } from "lucide-react";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signup } from "@/app/auth/actions";
import { safeNextPath } from "@/lib/safe-next-path";
import {
  APP_NEWS_CONSENT_TEXT,
  FREE_WATCHLIST_LIMIT,
  HEARD_FROM_OPTIONS,
} from "@/types";

// The root layout's canonical is "/", which every page inherits unless it sets
// its own; without this the sign-up page claimed to be the homepage.
export const metadata: Metadata = {
  alternates: { canonical: "/signup" },
  description:
    "Create a free account and keep every movie and show you want to see on one shelf.",
  title: "Create your account",
};

interface Props {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const { error, message, next: rawNext } = await searchParams;
  // Where to go after signing in, e.g. the title whose Add to shelf brought
  // them here. Only kept when it was asked for, so the plain sign-up and
  // sign-in links stay clean.
  const next = rawNext ? safeNextPath(rawNext) : undefined;
  const signInHref = next
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-wide">
            Create an account
          </h1>
          <p className="text-muted-foreground text-sm">
            Keep every movie and show you want to see on one shelf.
          </p>
          {/* State the cap up front: finding it mid-session costs more trust
              than reading it here. */}
          <p className="text-muted-foreground text-sm">
            Free: {FREE_WATCHLIST_LIMIT} titles on your shelf.
          </p>
        </div>

        {error && (
          <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </p>
        )}
        {message && (
          <p className="bg-new-release/10 text-new-release rounded-md px-3 py-2 text-sm">
            {message}
          </p>
        )}

        <OAuthButtons next={next} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="border-border w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background text-muted-foreground px-2">
              or continue with email
            </span>
          </div>
        </div>

        <form action={signup} className="space-y-4">
          {next && <input name="next" type="hidden" value={next} />}
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              autoComplete="new-password"
              id="password"
              minLength={8}
              name="password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heard_from">
              How did you hear about us?{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <select
                className="border-input bg-background text-foreground w-full appearance-none rounded-md border py-2 pr-9 pl-3 text-sm"
                defaultValue=""
                id="heard_from"
                name="heard_from"
              >
                <option value="">Choose one</option>
                {HEARD_FROM_OPTIONS.map(({ label, value }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
              />
            </div>
          </div>
          {/* Unticked by default: CASL needs the member to opt in. */}
          <div className="flex items-start gap-2">
            <input
              className="accent-primary mt-0.5 size-4 shrink-0"
              id="app_news_opt_in"
              name="app_news_opt_in"
              type="checkbox"
            />
            <Label
              className="leading-snug font-normal"
              htmlFor="app_news_opt_in"
            >
              {APP_NEWS_CONSENT_TEXT}
            </Label>
          </div>
          <Button className="w-full" type="submit">
            Create account
          </Button>
        </form>

        {/* Covers the Google and Apple buttons above as well as the form. */}
        <p className="text-muted-foreground text-center text-xs">
          By creating an account, you agree to the{" "}
          <Link className="underline" href="/terms">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link className="underline" href="/privacy">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link className="underline" href={signInHref}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
