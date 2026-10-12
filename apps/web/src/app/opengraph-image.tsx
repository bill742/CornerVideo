import { ImageResponse } from "next/og";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { BRAND, BRAND_COLORS } from "@/types";

const { light } = BRAND_COLORS;

export const alt = `${BRAND.name}: ${BRAND.tagline}`;
export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

const AWNING_STRIPES = 20;

/**
 * The shared social card: awning, rental sticker, name and tagline on a shelf.
 * Nothing here is request-specific, so Next renders it once at build time —
 * which is also why reading files from disk is safe. Detail pages inherit it
 * until they get images of their own.
 */
export default async function OpengraphImage() {
  // Satori reads woff but not woff2. Oswald is SIL OFL; see assets/fonts.
  const [oswald, icon] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/fonts/oswald-600.woff")),
    readFile(path.join(process.cwd(), "src/app/icon.svg"), "utf8"),
  ]);

  return new ImageResponse(
    <div
      style={{
        background: light.bg,
        color: light.text,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      {/* Satori blends gradient stops, so the awning is drawn as blocks. */}
      <div style={{ display: "flex", height: 56, width: "100%" }}>
        {Array.from({ length: AWNING_STRIPES }, (_, index) => (
          <div
            key={index}
            style={{
              background: index % 2 === 0 ? light.primary : light.bg,
              flex: 1,
            }}
          />
        ))}
      </div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flex: 1,
          gap: 56,
          padding: "0 96px",
        }}
      >
        <img
          alt=""
          height={240}
          src={`data:image/svg+xml;base64,${Buffer.from(icon).toString("base64")}`}
          style={{ flexShrink: 0 }}
          width={240}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontFamily: "Oswald",
              fontSize: 112,
              letterSpacing: 2,
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            {BRAND.name}
          </div>
          <div style={{ color: light.muted, fontSize: 38, maxWidth: 620 }}>
            {BRAND.tagline}
          </div>
        </div>
      </div>
      <div
        style={{
          background: light.shelf,
          boxShadow: "0 6px 8px rgba(0,0,0,0.25)",
          height: 14,
          marginBottom: 64,
          width: "100%",
        }}
      />
    </div>,
    {
      ...size,
      fonts: [{ data: oswald, name: "Oswald", style: "normal", weight: 600 }],
    }
  );
}
