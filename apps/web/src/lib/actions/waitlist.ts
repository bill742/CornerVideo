"use server";

import { readAttribution } from "@/lib/attribution";
import { createClient } from "@/lib/supabase/server";
import { APP_NEWS_CONSENT_TEXT } from "@/types";

export interface WaitlistState {
  message: string | null;
  status: "error" | "idle" | "success";
}

const SUCCESS: WaitlistState = {
  message: "You're on the list. We'll email you when there's news.",
  status: "success",
};

/**
 * Adds an email to the app waitlist through join_waitlist() (migration 005).
 *
 * Every accepted submission gets the same answer, new or already listed, so
 * the form can't be used to find out who has signed up. A filled-in honeypot
 * field gets that answer too, without writing anything, so a bot learns
 * nothing from it.
 *
 * The consent text stored is the server's constant, never what the browser
 * sent: the record has to show the wording the person was actually shown.
 */
export async function joinWaitlist(
  _previous: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  if (formData.get("website")) return SUCCESS;

  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { message: "Enter your email address.", status: "error" };
  }
  if (formData.get("consent") !== "on") {
    return {
      message: "Tick the box to say we can email you.",
      status: "error",
    };
  }

  const source = String(formData.get("source") ?? "").slice(0, 50) || null;
  const tags = await readAttribution();

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_waitlist", {
    p_consent_text: APP_NEWS_CONSENT_TEXT,
    p_email: email,
    p_source: source,
    p_utm_campaign: tags.utm_campaign ?? null,
    p_utm_medium: tags.utm_medium ?? null,
    p_utm_source: tags.utm_source ?? null,
  });

  if (error) {
    if (error.message === "invalid_email") {
      return {
        message: "That doesn't look like an email address.",
        status: "error",
      };
    }
    console.error("joinWaitlist failed:", error.message);
    return {
      message: "We couldn't add you just now. Try again in a moment.",
      status: "error",
    };
  }

  return SUCCESS;
}
