import { ContentTabs } from "@/components/home/content-tabs";

import { RegionProvider } from "@/lib/region-context";
import { BRAND } from "@/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cornervideo.app";

// No `offers` or ratings until pricing and store reviews exist — the brand
// guide rules out placeholder values.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  applicationCategory: "EntertainmentApplication",
  description:
    "A movie and TV watchlist with premiere dates and new release alerts.",
  name: BRAND.name,
  operatingSystem: "Web, iOS, Android",
  url: siteUrl,
};

/**
 * Fully static. The browse rows fetch TMDB from the browser through the route
 * handlers in src/app/api, and RegionProvider resolves the signed-in user's
 * region there too, so this shell has nothing request-specific in it.
 */
export default function Home() {
  return (
    <div className="space-y-12 py-8">
      <script
        // Static object, not user input; escaping "<" still keeps a stray
        // "</script>" in future copy from closing the tag early.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <RegionProvider>
        <ContentTabs />
      </RegionProvider>
    </div>
  );
}
