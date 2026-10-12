import Link from "next/link";

import { RentalSticker } from "@/components/brand/rental-sticker";

import { BRAND } from "@/types";

function Logo() {
  return (
    <Link
      aria-label={`${BRAND.name} home`}
      className="group flex items-center gap-2.5"
      href="/"
    >
      <RentalSticker className="h-10 w-10 -rotate-12 text-base tracking-tight transition-transform group-hover:rotate-0">
        CV
      </RentalSticker>
      <span className="font-display text-2xl font-semibold tracking-wide uppercase">
        {BRAND.name}
      </span>
    </Link>
  );
}

Logo.displayName = "Logo";

export { Logo };
