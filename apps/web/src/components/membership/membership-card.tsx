import { RentalSticker } from "@/components/brand/rental-sticker";

import { BRAND } from "@/types";

interface MembershipCardProps {
  email: string;
  /** ISO timestamp the account was created. */
  memberSince: string;
}

/** The laminated card from the store's wallet slot, made out to the member. */
function MembershipCard({ email, memberSince }: MembershipCardProps) {
  const since = new Date(memberSince).toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
  });

  return (
    <section
      aria-label="Your membership card"
      className="bg-card w-full max-w-sm overflow-hidden rounded-md border shadow-md"
    >
      <div className="bg-primary text-primary-foreground flex items-center gap-3 px-4 py-3">
        <RentalSticker
          aria-hidden
          className="bg-background text-primary h-9 w-9 text-sm ring-0"
        >
          CV
        </RentalSticker>
        <p className="font-display text-xl font-semibold tracking-wide uppercase">
          {BRAND.name}
        </p>
        <p className="ml-auto text-sm font-semibold">Member</p>
      </div>
      <dl className="grid gap-3 px-4 py-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Card holder</dt>
          <dd className="truncate font-semibold">{email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Member since</dt>
          <dd className="font-semibold">{since}</dd>
        </div>
      </dl>
      <div
        aria-hidden
        className="mx-4 mb-4 h-8 bg-[repeating-linear-gradient(90deg,var(--color-foreground)_0_2px,transparent_2px_4px,var(--color-foreground)_4px_7px,transparent_7px_9px)] opacity-80"
      />
    </section>
  );
}

MembershipCard.displayName = "MembershipCard";

export { MembershipCard };
