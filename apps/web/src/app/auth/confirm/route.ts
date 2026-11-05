import { type NextRequest, NextResponse } from "next/server";

import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

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
 * It verifies on GET, unlike /reset-password: a mail scanner that opens the
 * link first does confirm the email, which is harmless, and the member's own
 * click then gets the "sign in" message rather than a dead end.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;

  const destination = request.nextUrl.clone();
  destination.search = "";

  if (tokenHash && CONFIRM_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      // Shows the "email confirmed" notice (EmailConfirmedNotice).
      destination.pathname = "/";
      destination.searchParams.set("confirmed", "1");
      return NextResponse.redirect(destination);
    }
  }

  destination.pathname = "/login";
  destination.searchParams.set("message", EXPIRED_MESSAGE);
  return NextResponse.redirect(destination);
}
