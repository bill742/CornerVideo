import { NextResponse } from "next/server";

import type { User } from "@supabase/supabase-js";

import { readAttribution } from "@/lib/attribution";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

/** How recently an account must have been created to count as a sign-up. */
const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Google and Apple sign-ups skip the sign-up form, so handle_new_user gets no
 * UTM tags for them. Fill them in here, from the cookie AttributionCapture
 * set, but only for an account created moments ago: a returning member
 * signing in shouldn't be credited to whatever link they used today. Only
 * empty fields are written, and a failure never blocks the sign-in.
 */
async function recordOAuthAttribution(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User | null
) {
  if (!user) return;
  if (Date.now() - new Date(user.created_at).getTime() > NEW_ACCOUNT_WINDOW_MS)
    return;

  const tags = await readAttribution();
  if (Object.keys(tags).length === 0) return;

  const { error } = await supabase
    .from("profiles")
    .update(tags)
    .eq("id", user.id)
    .is("utm_source", null);
  if (error) console.error("recordOAuthAttribution failed:", error.message);
}

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await recordOAuthAttribution(supabase, data.user);
      const forwardedHost = request.headers.get("x-forwarded-host");
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
