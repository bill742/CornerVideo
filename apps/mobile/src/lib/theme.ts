import { vars } from "nativewind";
import { useColorScheme } from "react-native";
import { BRAND_COLORS, type BrandPalette } from "@moviewatchlist/shared";

type Scheme = "dark" | "light";

/** "#B3261E" → "179 38 30", the form `rgb(var(--x) / <alpha>)` needs. */
function channels(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

function toVars(palette: BrandPalette) {
  return vars({
    "--accent": channels(palette.accent),
    "--bg": channels(palette.bg),
    "--fg": channels(palette.text),
    "--highlight": channels(palette.highlight),
    "--ink": channels(palette.ink),
    "--line": channels(palette.line),
    "--muted": channels(palette.muted),
    "--on-primary": channels(palette.onPrimary),
    "--primary": channels(palette.primary),
    "--shelf": channels(palette.shelf),
    "--surface": channels(palette.surface),
  });
}

/**
 * The brand palette as NativeWind variables, applied once at the root so
 * `bg-bg`, `text-fg`, `bg-primary` and friends follow the system appearance.
 */
const THEME_VARS: Record<Scheme, ReturnType<typeof vars>> = {
  dark: toVars(BRAND_COLORS.dark),
  light: toVars(BRAND_COLORS.light),
};

/**
 * The active palette. Class names cover most styling; this is for the props
 * that take a raw colour — ActivityIndicator, placeholderTextColor, navigator
 * options, Switch tints.
 */
function useBrand() {
  const scheme: Scheme = useColorScheme() === "dark" ? "dark" : "light";
  return {
    colors: BRAND_COLORS[scheme],
    scheme,
    themeVars: THEME_VARS[scheme],
  };
}

export { useBrand };
