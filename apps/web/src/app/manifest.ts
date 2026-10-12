import type { MetadataRoute } from "next";

import { BRAND, BRAND_COLORS } from "@/types";

function manifest(): MetadataRoute.Manifest {
  return {
    background_color: BRAND_COLORS.light.bg,
    description: BRAND.description,
    display: "standalone",
    icons: [
      { sizes: "192x192", src: "/icon-192.png", type: "image/png" },
      { sizes: "512x512", src: "/icon-512.png", type: "image/png" },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "/icon-maskable-512.png",
        type: "image/png",
      },
    ],
    name: BRAND.name,
    short_name: BRAND.name,
    start_url: "/",
    theme_color: BRAND_COLORS.light.primary,
  };
}

export default manifest;
