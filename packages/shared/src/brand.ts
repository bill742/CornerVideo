/**
 * Corner Video brand constants, shared by web and mobile so the name, copy and
 * palette can't drift between them. The palette mirrors the brand guide's
 * tokens; every text pair passes WCAG 2.1 AA on its background.
 */
export const BRAND = {
  description:
    "Track movies and TV shows in one watchlist, see premiere dates for what's coming, and find your next watch. Your neighbourhood video store, minus the late fees.",
  name: "Corner Video",
  positioning:
    "One shelf for every movie and show you want to see, with premiere dates so nothing slips by.",
  tagline: "Your neighbourhood video store, minus the late fees.",
} as const;

export interface BrandPalette {
  /** Page background: tape-sleeve paper. */
  bg: string;
  /** Raised surfaces (cards, inputs) one step off the background. */
  surface: string;
  /** Hairlines and dividers. */
  line: string;
  /** The plank under a row of posters. Decorative, never behind text. */
  shelf: string;
  text: string;
  muted: string;
  /** Rental-sticker red: buttons, links, the sticker itself. */
  primary: string;
  /** Text on a `primary` fill. */
  onPrimary: string;
  /** Coming Soon, alerts, focus ring. */
  accent: string;
  /** Background fill only — always with `ink` text on top. */
  highlight: string;
  /** Dark text for use on `highlight`. */
  ink: string;
}

export const BRAND_COLORS: Record<"dark" | "light", BrandPalette> = {
  dark: {
    accent: "#5EEAD4",
    bg: "#15130F",
    highlight: "#E8A33A",
    ink: "#1C1A17",
    line: "#37322A",
    muted: "#A89F91",
    onPrimary: "#1C1A17",
    primary: "#F28B82",
    shelf: "#5A4630",
    surface: "#211E19",
    text: "#F6EFE0",
  },
  light: {
    accent: "#0F766E",
    bg: "#F6EFE0",
    highlight: "#E8A33A",
    ink: "#1C1A17",
    line: "#DDD1B8",
    muted: "#6B6358",
    onPrimary: "#FFFFFF",
    primary: "#B3261E",
    shelf: "#8A6A45",
    surface: "#FBF7EE",
    text: "#1C1A17",
  },
};
