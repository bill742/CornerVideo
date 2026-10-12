import Link from "next/link";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signup } from "@/app/auth/actions";

interface Props {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function SignupPage({ searchParams }: Props) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-wide">
            Create an account
          </h1>
          <p className="text-muted-foreground text-sm">
            Keep every movie and show you want to see on one shelf.
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

        <OAuthButtons />

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
            <Input
              autoComplete="new-password"
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </div>
          <Button className="w-full" type="submit">
            Create account
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link className="underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
