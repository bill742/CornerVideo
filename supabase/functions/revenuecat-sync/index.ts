// Re-syncs the signed-in member's App Store / Play Store / Test Store rows
// from RevenueCat. The app calls it right after a purchase or restore so
// Premium appears immediately, instead of whenever the webhook lands. A
// restore of a purchase already on this account sends no webhook at all, so
// this is also the only thing that picks one up.
//
// It syncs only the caller's own id, read from their session — and the
// state comes from RevenueCat's API, not the request — so a member can't use
// it to grant themselves anything.
//
// JWT verification is off in supabase/config.toml and done here instead with
// auth.getUser(), which works with both legacy and asymmetric signing keys.

import { createClient } from "npm:@supabase/supabase-js@2";

import { syncMember } from "../_shared/revenuecat.ts";

const secretKey = Deno.env.get("REVENUECAT_SECRET_KEY");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!secretKey) {
    console.error(
      "REVENUECAT_SECRET_KEY is not set; run `supabase secrets set`.",
    );
    return new Response("Sync not configured", { status: 500 });
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const {
    data: { user },
  } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
    const rows = await syncMember(supabase, user.id, secretKey);
    return Response.json({ synced: rows.length });
  } catch (err) {
    console.error(`revenuecat-sync for ${user.id} failed:`, err);
    return new Response("Sync failed", { status: 502 });
  }
});
