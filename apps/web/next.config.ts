import type { NextConfig } from "next";

import path from "path";

const monorepoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  images: {
    // Bypass the platform image optimizer for TMDB images — Netlify's Image
    // CDN now, Vercel's before the move: the custom loader returns TMDB's own
    // pre-sized CDN URLs, so no transformations are billed. See
    // src/lib/tmdb-image-loader.ts.
    //
    // `remotePatterns` is ignored while a custom loader is active, but kept
    // deliberately: Netlify's Next runtime maps it to the Image CDN's
    // `remote_images` allowlist, and that allowlist is strict — remove the
    // loader without it and every TMDB image 404s rather than falling back.
    loader: "custom",
    loaderFile: "./src/lib/tmdb-image-loader.ts",
    remotePatterns: [
      {
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
        protocol: "https",
      },
    ],
  },
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
