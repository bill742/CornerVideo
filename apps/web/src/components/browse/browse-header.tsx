import Link from "next/link";

import { Clapperboard, Tv } from "lucide-react";

type Aisle = "movies" | "tv";

const AISLES = [
  { href: "/movies", icon: Clapperboard, key: "movies", label: "Movies" },
  { href: "/tv", icon: Tv, key: "tv", label: "TV Shows" },
] as const;

interface Props {
  active: Aisle;
}

/**
 * The heading and Movies / TV Shows switch for /movies and /tv.
 *
 * These used to be two buttons toggling state on the homepage, so neither
 * shelf had an address. As links, each aisle is its own indexable page
 * ("Upcoming Movies & Release Dates", "TV Premiere Dates") that can be
 * shared and bookmarked. Server-rendered: nothing here needs the browser.
 */
function BrowseHeader({ active }: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-wide md:text-5xl">
          Browse the aisles
        </h1>
        <p className="text-muted-foreground mt-1">
          What&apos;s new, what&apos;s coming, and what everyone&apos;s renting.
        </p>
      </div>
      <nav aria-label="Aisles">
        <ul className="bg-card flex w-fit gap-1 rounded-sm border p-1">
          {AISLES.map(({ href, icon: Icon, key, label }) => {
            const current = key === active;
            return (
              <li key={key}>
                <Link
                  aria-current={current ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-semibold no-underline transition-colors ${
                    current
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  href={href}
                >
                  <Icon aria-hidden className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

BrowseHeader.displayName = "BrowseHeader";

export { BrowseHeader };
