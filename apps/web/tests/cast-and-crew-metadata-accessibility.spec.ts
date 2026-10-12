/* eslint-disable no-console */
import AxeBuilder from "@axe-core/playwright";
import { BRAND } from "@moviewatchlist/shared";
import { expect, test } from "@playwright/test";

import { switchToDarkMode } from "./helpers/theme";

// Tom Hanks — stable, well-known TMDB entry (ID 31)
const KNOWN_PERSON_ID = "31";
const KNOWN_PERSON_NAME = "Tom Hanks";

test.describe("Cast and crew person page does not have accessibility issues", () => {
  test("Should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    await page.goto(`/cast-and-crew/${KNOWN_PERSON_ID}`);

    console.log("Running accessibility scan on cast and crew person page");

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
  test("Verify cast and crew person page metadata", async ({ page }) => {
    await page.goto(`/cast-and-crew/${KNOWN_PERSON_ID}`);

    console.log("Checking metadata on cast and crew person page");

    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");

    await expect(page).toHaveTitle(`${KNOWN_PERSON_NAME} | ${BRAND.name}`);

    // Description is derived from the person's biography (sliced to 160 chars)
    const descriptionMeta = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(descriptionMeta).toBeTruthy();
    expect(descriptionMeta!.length).toBeLessThanOrEqual(160);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${process.env.NEXT_PUBLIC_SITE_URL}/cast-and-crew/${KNOWN_PERSON_ID}`
    );
  });
});
