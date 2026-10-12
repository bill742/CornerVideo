import Link from "next/link";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { login } from "@/app/auth/actions";

interface Props {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { error, message, next } = await searchParams;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-wide">
            Sign in
          </h1>
          <p className="text-muted-foreground text-sm">
            Welcome back to Corner Video
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

        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={next ?? "/"} />
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
              autoComplete="current-password"
              id="password"
              name="password"
              required
              type="password"
            />
          </div>
          <Button className="w-full" type="submit">
            Sign in
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link className="underline" href="/signup">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
