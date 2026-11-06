import { type NextRequest, NextResponse } from "next/server";

import { type EmailOtpType, createClient } from "@supabase/supabase-js";

// The types a "Confirm signup" link can carry. Supabase's template docs use
// "email"; "signup" is its older name.
const CONFIRM_TYPES: readonly EmailOtpType[] = ["email", "signup"];

const EXPIRED_MESSAGE =
  "That confirmation link has expired or was already used. If you've confirmed your email, sign in.";

/**
 * Where the "Confirm signup" email lands, for sign-ups from either app (the
 * Supabase template links here with a token_hash — see apps/web/README.md →
 * "Email confirmation"). Unlike a PKCE code, the token works on any device.
 *
 * It confirms the email but signs nobody in. The link carries no proof of
 * who opened it, so creating a session here would let someone send their own
 * confirmation link to another person and leave them signed in to the
 * sender's account (login CSRF). Verifying with a client that keeps no cookies
 * leaves whoever opened it exactly as they were; the member then signs in.
 *
 * A mail scanner opening the link first still confirms the email, which is
 * harmless: the member's own click then gets the "sign in" message.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;

  const destination = request.nextUrl.clone();
  destination.search = "";
  destination.pathname = "/login";

  if (tokenHash && CONFIRM_TYPES.includes(type)) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      // Revoke the session verifyOtp created; nobody will use it.
      await supabase.auth.signOut({ scope: "local" });
      // Shows the "email confirmed" notice (SiteNotice).
      destination.searchParams.set("confirmed", "1");
      return NextResponse.redirect(destination);
    }
  }

  destination.searchParams.set("message", EXPIRED_MESSAGE);
  return NextResponse.redirect(destination);
}
