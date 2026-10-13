import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cornervideo.app";

/**
 * Only the stable entry points. Detail pages are deliberately absent — they are
 * disallowed in robots.ts, and listing tens of thousands of TMDB-backed URLs
 * would invite exactly the crawl volume that exhausted the function allowance.
 */
function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      changeFrequency: "daily",
      lastModified: new Date(),
      priority: 1,
      url: siteUrl,
    },
  ];
}

export default sitemap;
