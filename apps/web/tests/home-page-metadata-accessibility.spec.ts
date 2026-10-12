/* eslint-disable no-console */
import AxeBuilder from "@axe-core/playwright";
import { BRAND } from "@moviewatchlist/shared";
import { expect, test } from "@playwright/test";

import { switchToDarkMode } from "./helpers/theme";

test.describe("Homepage does not have accessibility issues", () => {
  test("Should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    await page.goto("./");

    console.log("Running accessibility scan on homepage");

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
  test("Verify Home Page Metadata", async ({ page }) => {
    await page.goto("/");

    console.log("Checking metadata on homepage");

    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");

    await expect(page).toHaveTitle(
      `Movie & TV Watchlist & Premiere Tracker | ${BRAND.name}`
    );

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      BRAND.description
    );

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      process.env.NEXT_PUBLIC_SITE_URL!
    );
  });
});
