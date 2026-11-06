import type { Metadata } from "next";

import { DeleteAccount } from "@/components/membership/delete-account";
import { MembershipCard } from "@/components/membership/membership-card";
import {
  type BillingNotice,
  PremiumPlan,
} from "@/components/membership/premium-plan";

import { getProfile } from "@/lib/actions/profile";
import { requireUser } from "@/lib/auth";
import { getMembership, getPremiumPrices } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_REGION } from "@/types";

import { PreferencesForm } from "./preferences-form";

export const metadata: Metadata = {
  title: "Membership",
};

const NOTICES = new Set(["cancelled", "error", "success", "unavailable"]);

interface Props {
  searchParams: Promise<{ billing?: string; checkout?: string }>;
}

export default async function ProfilePage({ searchParams }: Props) {
  const user = await requireUser("/profile");

  const [{ billing, checkout }, profile, membership, prices] =
    await Promise.all([
      searchParams,
      getProfile(),
      createClient().then((supabase) => getMembership(supabase, user.id)),
      getPremiumPrices(),
    ]);

  const flag = checkout ?? billing;
  const notice = (
    flag && NOTICES.has(flag) ? flag : undefined
  ) as BillingNotice;

  return (
    <div className="space-y-10 py-8">
      <h1 className="font-display text-4xl font-semibold tracking-wide">
        Membership
      </h1>
      <MembershipCard
        email={user.email ?? ""}
        memberSince={user.created_at}
        premium={membership.premium}
      />
      <PremiumPlan membership={membership} notice={notice} prices={prices} />
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Preferences</h2>
        <PreferencesForm
          initialRegion={profile?.region ?? DEFAULT_REGION}
          initialTheme={profile?.theme ?? "system"}
        />
      </div>
      <DeleteAccount storePlatform={membership.storePlatform} />
    </div>
  );
}
