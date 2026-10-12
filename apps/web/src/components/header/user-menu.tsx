"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { BookMarked, IdCard, LogIn, LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { createClient } from "@/lib/supabase/client";

function UserMenu() {
  const [pending, startTransition] = useTransition();
  // `undefined` means "not resolved yet" — distinct from `null` (signed out),
  // so the first paint renders neutral space rather than flashing "Sign in" at
  // a user who is in fact signed in.
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  // Signing in is a server action: it sets the cookie and redirects, so
  // supabase-js in this tab never performs it and onAuthStateChange stays
  // silent. This component lives in the root layout, so it survives the
  // redirect without remounting, and kept offering "Sign in" to someone already
  // signed in. Detail pages looked correct only because their buttons mount
  // fresh. Re-reading on navigation covers it, since the redirect is itself a
  // navigation. Sign-out is handled in the browser (see below), so that
  // direction updates through onAuthStateChange instead.
  const pathname = usePathname();
  const router = useRouter();
  // One client for the component's life. Building a new one per navigation
  // spawns multiple GoTrue instances against the same storage.
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    // getSession, not getUser: this only decides what the header renders, and
    // getUser is a round trip to the auth server on every navigation. That cost
    // was enough to push detail pages past their load budget in Firefox. Route
    // gating still uses requireUser() on the server, and RLS guards the data —
    // nothing is authorized on the strength of this read.
    supabase.auth.getSession().then(({ data }) => {
      if (active) setEmail(data.session?.user?.email ?? null);
    });

    return () => {
      active = false;
    };
  }, [pathname, supabase]);

  useEffect(() => {
    // Catches whatever happens without a navigation: token refreshes, and
    // sign-outs performed in another tab.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (email === undefined) {
    return <div aria-hidden className="h-9 w-9" />;
  }

  if (!email) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/login">
          <LogIn className="mr-1.5 h-4 w-4" />
          Sign in
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="User menu" size="icon" variant="ghost">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="text-muted-foreground truncate px-2 py-1.5 text-xs">
          {email}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/watchlist">
            <BookMarked className="mr-2 h-4 w-4" />
            My Shelf
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <IdCard className="mr-2 h-4 w-4" />
            Membership
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          disabled={pending}
          onSelect={() =>
            startTransition(async () => {
              // Signing out in the browser rather than through the server
              // action. The action redirected, and a server-action redirect
              // makes React re-render the root layout on the client — where
              // next-themes keeps a <script> that React will not execute,
              // warning on every sign-out. Clearing the session here drops the
              // same cookies, fires onAuthStateChange so the header updates
              // immediately, and leaves the layout alone.
              //
              // `local` scope ends this browser's session only. The default is
              // `global`, which revokes every session the account has — signing
              // out on a laptop would sign you out on your phone, which is not
              // what a "Sign out" in this menu implies.
              await supabase.auth.signOut({ scope: "local" });
              router.push("/");
            })
          }
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

UserMenu.displayName = "UserMenu";

export { UserMenu };
