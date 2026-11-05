"use server";

import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = safeNextPath(formData.get("next") as string | null);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`
    );
  }

  // No `revalidatePath("/", "layout")` here. It existed so the header would
  // pick up the new session back when the layout read it and passed down an
  // email; the header resolves its own state now. It also reached further than
  // it looked — "layout" covers every route beneath the root layout, so each
  // sign-in asked to invalidate the whole ISR cache. That is inert while no tag
  // cache is configured on Cloudflare, which is what would make it easy to miss.
  redirect(next);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
    password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Supabase reports success without sending anything when the email is
  // already registered, so the message has to cover both cases.
  redirect(
    `/signup?message=${encodeURIComponent(
      "If this email is new to us, check your inbox for a link to confirm your account. Already have an account? Sign in, or reset your password."
    )}`
  );
}

/**
 * Sends a password reset email. The page always shows the same confirmation,
 * whether or not the email has an account, so the form can't be used to find
 * out who is registered. Only rate limiting is reported, since that reveals
 * nothing about the address.
 *
 * The link itself comes from the Supabase "Reset password" email template,
 * which points at /reset-password with a token_hash (see apps/web/README.md →
 * "Password reset"). Mobile requests the same email, so both apps share that
 * page.
 */
export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string).trim();

  // No redirectTo: the email template builds the link from the Site URL.
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error?.status === 429) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        "Too many reset requests. Wait a few minutes and try again."
      )}`
    );
  }
  if (error) console.error("resetPasswordForEmail failed:", error.message);

  redirect("/forgot-password?sent=1");
}

const EXPIRED_LINK =
  "That reset link has expired or was already used. Send a new one below.";

/**
 * Sets a new password from the reset page.
 *
 * The emailed token is only spent here, when the member submits the form —
 * never on page load — because some mail providers open links to scan them,
 * which would use the token up before the member ever clicked it.
 *
 * Without a token the member must already be signed in: that's the retry
 * after a rejected password, since the token was spent on the first try.
 */
export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const tokenHash = formData.get("token_hash") as string | null;
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (password !== confirm) {
    const params = new URLSearchParams({ error: "The passwords don't match." });
    if (tokenHash) params.set("token_hash", tokenHash);
    redirect(`/reset-password?${params}`);
  }

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (error) {
      redirect(`/forgot-password?error=${encodeURIComponent(EXPIRED_LINK)}`);
    }
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/forgot-password?error=${encodeURIComponent(EXPIRED_LINK)}`);
    }
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // The member is signed in now, so the retry needs no token.
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/reset-password?done=1");
}

// There is no `signout` action. It lived here, and the header called it, but a
// server-action redirect makes React re-render the root layout on the client —
// where next-themes keeps a <script> it will not execute, warning every time.
// UserMenu clears the session in the browser instead, which drops the same
// cookies and lets onAuthStateChange update the header immediately.
