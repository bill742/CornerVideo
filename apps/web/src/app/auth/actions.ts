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

  redirect("/signup?message=Check your email to confirm your account.");
}

// There is no `signout` action. It lived here, and the header called it, but a
// server-action redirect makes React re-render the root layout on the client —
// where next-themes keeps a <script> it will not execute, warning every time.
// UserMenu clears the session in the browser instead, which drops the same
// cookies and lets onAuthStateChange update the header immediately.
