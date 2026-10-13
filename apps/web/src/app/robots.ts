import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cornervideo.app";

/**
 * There was no robots.txt at all, so crawlers were free to walk every
 * /movies/[id], /tv/[id] and /cast-and-crew/[id] URL TMDB exposes — each one a
 * fresh render against the plan's function allowance.
 *
 * The detail pages are CDN-cached now, so crawling them is far cheaper, but
 * they are still bulk TMDB data with no reason to be indexed. /api and /search
 * are disallowed because they are unbounded: every distinct query string is a
 * new uncacheable render.
 *
 * AI training crawlers are shut out of the whole site by name. They send no
 * visitors back, and Meta's meta-externalagent kept walking the detail pages
 * despite the wildcard rule — on the Workers free plan each of those cold
 * renders blows the 10 ms CPU limit and 503s. A named group is the clearest
 * opt-out, but robots.txt is advisory; a crawler that ignores it needs a WAF
 * rule. Search engines and link-preview fetchers (facebookexternalhit,
 * Twitterbot, Slackbot) are deliberately not listed.
 */
const AI_TRAINING_CRAWLERS = [
  "Amazonbot",
  "anthropic-ai",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "ClaudeBot",
  "cohere-ai",
  "Diffbot",
  "FacebookBot",
  "Google-Extended",
  "GPTBot",
  "meta-externalagent",
  "Omgilibot",
  "Timpibot",
];

function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        disallow: "/",
        userAgent: AI_TRAINING_CRAWLERS,
      },
      {
        disallow: [
          "/api/",
          "/search",
          "/watchlist",
          "/profile",
          "/login",
          "/signup",
          "/auth/",
          "/movies/",
          "/tv/",
          "/cast-and-crew/",
        ],
        userAgent: "*",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

export default robots;
