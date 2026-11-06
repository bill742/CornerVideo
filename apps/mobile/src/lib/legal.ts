import { BRAND } from "@moviewatchlist/shared";

/** The web app hosts the legal pages for both apps. */
export const PRIVACY_URL = `${BRAND.url}/privacy`;
export const TERMS_URL = `${BRAND.url}/terms`;

/**
 * App Review (guideline 3.1.2) wants a Terms of Use link on the purchase
 * screen. Apple's standard licence agreement serves for App Store purchases,
 * and our Terms point to it, so no custom EULA is set in App Store Connect.
 */
export const APPLE_EULA_URL =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
