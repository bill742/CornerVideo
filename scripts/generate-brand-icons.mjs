#!/usr/bin/env node
/**
 * Renders every Corner Video icon (web + mobile) from one SVG source: the red
 * "CV" rental sticker from the brand guide. Run from the repo root after
 * changing the mark:
 *
 *   node scripts/generate-brand-icons.mjs
 *
 * Uses sharp, which is already in the hoisted node_modules via Next.js. The
 * letters are stroked paths rather than text so the render doesn't depend on
 * which fonts the machine has.
 */
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const PAPER = "#F6EFE0";
const RED = "#B3261E";

/**
 * The sticker on a 512 canvas. `scale` shrinks it about the centre to leave
 * the padding a platform's mask needs; `mono` draws it as a single colour.
 */
function sticker({ mono = false, scale = 1 } = {}) {
  const marks = (ink) => `
    <circle cx="256" cy="256" r="212" fill="none" stroke="${ink}" stroke-width="10"/>
    <g transform="translate(6 0)">
      <path d="M236 190 A56 76 0 1 0 236 322" fill="none" stroke="${ink}" stroke-width="44"/>
      <path d="M262 172 H302 L316 266 L330 172 H370 L334 340 H298 Z" fill="${ink}"/>
    </g>`;
  const transform = `translate(256 256) scale(${scale}) rotate(-10) translate(-256 -256)`;

  // Android's monochrome layer is a single-colour silhouette, so the ring and
  // letters are knocked out of the disc rather than drawn on top of it.
  if (mono) {
    return `
  <mask id="cut"><g transform="${transform}">
    <circle cx="256" cy="256" r="236" fill="#FFFFFF"/>${marks("#000000")}
  </g></mask>
  <rect width="512" height="512" fill="#FFFFFF" mask="url(#cut)"/>`;
  }

  return `
  <g transform="${transform}">
    <circle cx="256" cy="256" r="236" fill="${RED}"/>${marks(PAPER)}
  </g>`;
}

function svg(body, background) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${
    background ? `<rect width="512" height="512" fill="${background}"/>` : ""
  }${body}</svg>`;
}

async function png(source, size, file) {
  const out = path.isAbsolute(file) ? file : path.join(root, file);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(source), { density: 72 * (size / 512) * 4 })
    .resize(size, size)
    .png()
    .toFile(out);
  console.log(`${file} (${size}px)`);
}

// Web: a scalable favicon plus PNGs for the manifest and Apple touch icon.
const webSticker = svg(sticker());
await writeFile(path.join(root, "apps/web/src/app/icon.svg"), webSticker);
console.log("apps/web/src/app/icon.svg");
await png(svg(sticker({ scale: 0.82 }), PAPER), 180, "apps/web/src/app/apple-icon.png");
await png(svg(sticker({ scale: 0.82 }), PAPER), 192, "apps/web/public/icon-192.png");
await png(svg(sticker({ scale: 0.82 }), PAPER), 512, "apps/web/public/icon-512.png");
// Maskable icons are cropped to a circle as small as 80% of the canvas.
await png(svg(sticker({ scale: 0.7 }), PAPER), 512, "apps/web/public/icon-maskable-512.png");

// Mobile: iOS icon (no transparency allowed), Android adaptive layers,
// splash mark and Expo web favicon.
await png(svg(sticker({ scale: 0.82 }), PAPER), 1024, "apps/mobile/assets/images/icon.png");
// Android keeps the inner ~66% of a foreground layer visible.
await png(svg(sticker({ scale: 0.6 })), 512, "apps/mobile/assets/images/android-icon-foreground.png");
await png(svg("", PAPER), 512, "apps/mobile/assets/images/android-icon-background.png");
await png(svg(sticker({ mono: true, scale: 0.6 })), 432, "apps/mobile/assets/images/android-icon-monochrome.png");
await png(webSticker, 512, "apps/mobile/assets/images/splash-icon.png");
await png(webSticker, 48, "apps/mobile/assets/images/favicon.png");

// The guide's legibility check: the mark must still read at 29px. Written to
// the temp dir for a look, not committed.
await png(
  svg(sticker({ scale: 0.82 }), PAPER),
  29,
  path.join(os.tmpdir(), "corner-video-icon-29px.png")
);
