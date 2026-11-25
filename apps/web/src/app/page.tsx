import Link from "next/link";

import { ArrowRight, CalendarClock, Film, Library } from "lucide-react";

import { WaitlistForm } from "@/components/landing/waitlist-form";
import { MovieList } from "@/components/movies/movie-list";
import { Button } from "@/components/ui/button";

import { getUpcomingMovies } from "@/data/loaders";
import {
  BRAND,
  DEFAULT_REGION,
  FREE_WATCHLIST_LIMIT,
  LANDING_PILLARS,
  LANDING_STEPS,
} from "@/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cornervideo.app";

// No `offers` or ratings until pricing and store reviews exist — the brand
// guide rules out placeholder values. "Web" only until the iOS and Android
// apps are in the stores. `url` uses the same trailing-slash form as the
// canonical and the sitemap.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  applicationCategory: "EntertainmentApplication",
  description:
    "A movie and TV watchlist with premiere dates and new release alerts.",
  name: BRAND.name,
  operatingSystem: "Web",
  url: new URL("/", siteUrl).href,
};

/**
 * The Coming Soon teaser is rendered here on the server, so it's in the raw
 * HTML and can't shift the layout. Regenerated at most once an hour, and the
 * TMDB fetch underneath is cached for the same hour (utils/fetch-apis.ts), so
 * a crawler or a Reddit spike costs no extra TMDB calls or CPU.
 */
export const revalidate = 3600;

const TEASER_COUNT = 6;

const STEP_ICONS = [Film, Library, CalendarClock] as const;

/**
 * The landing page for visitors who don't know Corner Video yet (SEO audit
 * finding 1). Everything is server-rendered and static. Signed-in members
 * never see it: the middleware sends them on to /movies.
 *
 * TODO(screenshots): "How it works" is icon-led until the light and dark
 * screenshots from the recording session exist; add them per step with
 * next/image.
 */
export default async function Home() {
  const upcoming = (await getUpcomingMovies(DEFAULT_REGION)) ?? [];

  return (
    <div className="space-y-20 py-10 md:py-16">
      <script
        // Static object, not user input; escaping "<" still keeps a stray
        // "</script>" in future copy from closing the tag early.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />

      <section aria-labelledby="hero-heading" className="max-w-3xl space-y-6">
        <h1
          className="font-display text-5xl leading-[1.05] font-semibold tracking-wide md:text-7xl"
          id="hero-heading"
        >
          {BRAND.tagline}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg md:text-xl">
          {BRAND.name} is a watchlist for movies and TV. {BRAND.positioning}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Start your shelf — free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/movies">
              Browse the aisles
              <ArrowRight aria-hidden className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Your first {FREE_WATCHLIST_LIMIT} titles are free. No card needed.
        </p>
      </section>

      <section aria-labelledby="how-heading" className="space-y-8">
        <h2
          className="font-display text-3xl font-semibold tracking-wide"
          id="how-heading"
        >
          How it works
        </h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {LANDING_STEPS.map((step, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <li
                className="bg-card space-y-3 rounded-md border p-6"
                key={step.title}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="bg-primary text-primary-foreground font-display flex size-9 items-center justify-center rounded-full text-lg font-semibold"
                  >
                    {index + 1}
                  </span>
                  <Icon aria-hidden className="text-muted-foreground size-5" />
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {upcoming.length > 0 && (
        <section aria-label="Coming Soon preview" className="space-y-6">
          <MovieList
            heading="Coming Soon"
            movies={upcoming.slice(0, TEASER_COUNT)}
          />
          <Link
            className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
            href="/movies"
          >
            See everything on the wall
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </section>
      )}

      <section aria-labelledby="why-heading" className="space-y-8">
        <h2
          className="font-display text-3xl font-semibold tracking-wide"
          id="why-heading"
        >
          Why {BRAND.name}
        </h2>
        <ul className="grid gap-6 md:grid-cols-3">
          {LANDING_PILLARS.map((pillar) => (
            <li className="space-y-2" key={pillar.title}>
              <h3 className="font-display text-xl font-semibold tracking-wide">
                {pillar.title}
              </h3>
              <p className="text-muted-foreground">{pillar.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="apps-heading"
        className="bg-card grid gap-6 rounded-md border p-6 md:grid-cols-2 md:p-10"
      >
        <div className="space-y-3">
          <h2
            className="font-display text-3xl font-semibold tracking-wide"
            id="apps-heading"
          >
            Coming to iPhone and Android
          </h2>
          <p className="text-muted-foreground">
            The apps are on their way, with New release alerts on your phone.
            Join the list for an email when they open, and a founding-member
            price for the people who signed up first.
          </p>
        </div>
        <WaitlistForm source="home" />
      </section>
    </div>
  );
}
