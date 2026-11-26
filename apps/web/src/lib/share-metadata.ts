import type { Metadata } from "next";

import { BRAND } from "@/types";

interface ShareInput {
  backdropPath?: string | null;
  description: string;
  /** Site path, e.g. "/movies/123". Resolved against metadataBase. */
  path: string;
  posterPath?: string | null;
  title: string;
  type: "video.movie" | "video.tv_show";
}

// Sizes TMDB serves. w780 backdrops are 16:9, close to the 1.91:1 link cards
// use; posters are 2:3 and only a fallback.
const BACKDROP = { height: 439, size: "w780", width: 780 } as const;
const POSTER = { height: 750, size: "w500", width: 500 } as const;

/**
 * The link-preview tags for a title page (SEO audit finding 5): its own
 * title, overview and TMDB image instead of the site-wide card.
 *
 * Next merges `openGraph` shallowly, so everything the root layout sets
 * (siteName, url, type) is repeated here, or it would be dropped.
 *
 * Not a generated per-title image: rendering one on demand costs far more
 * than the free Workers plan's 10 ms of CPU. That waits for Workers Paid.
 */
function shareMetadata({
  backdropPath,
  description,
  path,
  posterPath,
  title,
  type,
}: ShareInput): Pick<Metadata, "openGraph" | "twitter"> {
  const base = process.env.NEXT_PUBLIC_API_IMAGE_PATH;
  const image =
    base && backdropPath
      ? {
          alt: title,
          height: BACKDROP.height,
          url: `${base}${BACKDROP.size}${backdropPath}`,
          width: BACKDROP.width,
        }
      : base && posterPath
        ? {
            alt: title,
            height: POSTER.height,
            url: `${base}${POSTER.size}${posterPath}`,
            width: POSTER.width,
          }
        : null;

  return {
    openGraph: {
      description,
      siteName: BRAND.name,
      title,
      type,
      url: path,
      // Without a TMDB image the site-wide card (app/opengraph-image.tsx)
      // still applies.
      ...(image && { images: [image] }),
    },
    twitter: {
      card: "summary_large_image",
      description,
      title,
      ...(image && { images: [image.url] }),
    },
  };
}

export { shareMetadata };
