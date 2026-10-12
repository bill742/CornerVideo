/* eslint-disable no-console */
import AxeBuilder from "@axe-core/playwright";
import { BRAND } from "@moviewatchlist/shared";
import { expect, test } from "@playwright/test";

import { submitSearch } from "./helpers/search";
import { switchToDarkMode } from "./helpers/theme";

const KNOWN_MOVIE_TITLE = "Inception";

test.describe("Search results page does not have accessibility issues", () => {
  test("Should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    await page.goto("./");

    await submitSearch(page, KNOWN_MOVIE_TITLE);

    console.log("Running accessibility scan on search results page");

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
  test("Verify Search Results Page Metadata", async ({ page }) => {
    await page.goto("./");

    await submitSearch(page, KNOWN_MOVIE_TITLE);

    console.log("Checking metadata on search results page");

    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");

    await expect(page).toHaveTitle(
      `"${KNOWN_MOVIE_TITLE}" search results | ${BRAND.name}`
    );

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      `Search results for "${KNOWN_MOVIE_TITLE}" on ${BRAND.name}.`
    );

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${process.env.NEXT_PUBLIC_SITE_URL}/search?term=${KNOWN_MOVIE_TITLE}`
    );
  });
});
