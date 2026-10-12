import type { Metadata } from "next";

import { MembershipCard } from "@/components/membership/membership-card";

import { getProfile } from "@/lib/actions/profile";
import { requireUser } from "@/lib/auth";
import { DEFAULT_REGION } from "@/types";

import { PreferencesForm } from "./preferences-form";

export const metadata: Metadata = {
  title: "Membership",
};

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  const profile = await getProfile();

  return (
    <div className="space-y-10 py-8">
      <h1 className="font-display text-4xl font-semibold tracking-wide">
        Membership
      </h1>
      <MembershipCard email={user.email ?? ""} memberSince={user.created_at} />
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Preferences</h2>
        <PreferencesForm
          initialRegion={profile?.region ?? DEFAULT_REGION}
          initialTheme={profile?.theme ?? "system"}
        />
      </div>
    </div>
  );
}
