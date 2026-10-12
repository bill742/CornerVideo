import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import type { Theme } from "@moviewatchlist/shared";

import { getProfile, updateProfileTheme } from "./profile";

/**
 * The device's copy of the theme preference. The profile row is the source of
 * truth (the web app reads the same column), but it needs a signed-in network
 * round trip, so launch applies this copy first to avoid a flash of the wrong
 * scheme behind the splash.
 */
const THEME_KEY = "appearance:theme";

function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light" || value === "system";
}

/**
 * Overrides the scheme app-wide. Everything reads it through useColorScheme,
 * and on iOS it also sets the window's interface style, so native controls
 * (headers, switches, the keyboard) follow too.
 */
function applyTheme(theme: Theme): void {
  Appearance.setColorScheme(theme === "system" ? "unspecified" : theme);
}

/** Applies the device's saved preference. Call once before first render. */
export async function restoreTheme(): Promise<void> {
  const saved = await AsyncStorage.getItem(THEME_KEY).catch(() => null);
  applyTheme(isTheme(saved) ? saved : "system");
}

export async function getTheme(): Promise<Theme> {
  const saved = await AsyncStorage.getItem(THEME_KEY).catch(() => null);
  return isTheme(saved) ? saved : "system";
}

/**
 * Picks up a preference saved on another device or on the web. Best-effort:
 * offline, the device keeps whatever it last had.
 */
export async function syncThemeFromProfile(): Promise<void> {
  const profile = await getProfile().catch(() => null);
  if (!profile || !isTheme(profile.theme)) return;

  applyTheme(profile.theme);
  await AsyncStorage.setItem(THEME_KEY, profile.theme);
}

/**
 * Saves to the profile first, so a failed write leaves the app showing the
 * preference the server actually holds.
 */
export async function updateTheme(theme: Theme): Promise<void> {
  await updateProfileTheme(theme);
  applyTheme(theme);
  await AsyncStorage.setItem(THEME_KEY, theme);
}
