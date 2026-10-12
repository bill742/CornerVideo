/* eslint-disable no-console */
import AxeBuilder from "@axe-core/playwright";
import { BRAND } from "@moviewatchlist/shared";
import { expect, test } from "@playwright/test";

import { switchToDarkMode } from "./helpers/theme";

// The Dark Knight — stable, well-known TMDB entry (ID 155)
const KNOWN_MOVIE_ID = "155";
const KNOWN_MOVIE_TITLE = "The Dark Knight";
const KNOWN_MOVIE_YEAR = "2008";

test.describe("Movie detail page does not have accessibility issues", () => {
  test("Should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    await page.goto(`/movies/${KNOWN_MOVIE_ID}`);

    console.log("Running accessibility scan on movie detail page");

    // Test light mode
    const lightModeClass = await page.locator("html").getAttribute("class");
    expect(lightModeClass).toContain("light");
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Test dark mode
    console.log("Switching to Dark mode for accessibility testing");
    await switchToDarkMode(page);

    const darkModeAccessibilityScanResults = await new AxeBuilder({
      page,
    }).analyze();
    expect(darkModeAccessibilityScanResults.violations).toEqual([]);
  });
});

test.describe("Page Metadata and Document Structure", () => {
  test("Verify Movie Detail Page Metadata", async ({ page }) => {
    await page.goto(`/movies/${KNOWN_MOVIE_ID}`);

    console.log("Checking metadata on movie detail page");

    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");

    await expect(page).toHaveTitle(
      `${KNOWN_MOVIE_TITLE} (${KNOWN_MOVIE_YEAR}) | ${BRAND.name}`
    );

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker."
    );

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${process.env.NEXT_PUBLIC_SITE_URL}/movies/${KNOWN_MOVIE_ID}`
    );
  });
});
