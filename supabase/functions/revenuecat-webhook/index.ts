// RevenueCat → public.subscriptions (App Store, Play Store and Test Store).
//
// RevenueCat calls this for every purchase event. It is deployed with JWT
// verification off (supabase/config.toml) because RevenueCat sends no
// Supabase JWT. Instead the dashboard is set to send a fixed Authorization
// header, compared here against REVENUECAT_WEBHOOK_AUTH.
//
// Writes use the service role, which bypasses RLS: members can only read
// their own subscriptions rows, never write them.

import { createClient } from "npm:@supabase/supabase-js@2";

import { isMemberId, syncMember } from "../_shared/revenuecat.ts";

const secretKey = Deno.env.get("REVENUECAT_SECRET_KEY");
const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to every Edge Function.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

/** Compares in constant time, so the header can't be guessed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

interface WebhookEvent {
  aliases?: string[];
  app_user_id?: string;
  id?: string;
  original_app_user_id?: string;
  transferred_from?: string[];
  transferred_to?: string[];
  type?: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!secretKey || !expectedAuth) {
    // A 500 (not 401) so RevenueCat keeps retrying: once the secrets are
    // set, the retries go through and no event is lost.
    console.error(
      "REVENUECAT_SECRET_KEY or REVENUECAT_WEBHOOK_AUTH is not set; run `supabase secrets set`.",
    );
    return new Response("Webhook not configured", { status: 500 });
  }

  if (!safeEqual(req.headers.get("authorization") ?? "", expectedAuth)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = (await req.json()).event ?? {};
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Every member the event touches — both sides of a transfer included, so
  // the account losing the purchase is downgraded as the other is upgraded.
  const members = new Set(
    [
      event.app_user_id,
      event.original_app_user_id,
      ...(event.aliases ?? []),
      ...(event.transferred_from ?? []),
      ...(event.transferred_to ?? []),
    ].filter(isMemberId),
  );

  if (members.size === 0) {
    // The dashboard's "Send test event", or an anonymous purchase. Nothing
    // to write; acknowledge it so RevenueCat stops retrying.
    console.warn(`No member in ${event.type} (${event.id}); skipping.`);
    return Response.json({ received: true });
  }

  try {
    for (const userId of members) {
      await syncMember(supabase, userId, secretKey);
    }
  } catch (err) {
    // 500 makes RevenueCat retry with backoff, which covers transient errors.
    console.error(`Handling ${event.type} (${event.id}) failed:`, err);
    return new Response("Handler failed", { status: 500 });
  }

  return Response.json({ received: true });
});
