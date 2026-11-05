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

    // The shelves load in the browser behind a VhsLoader that fades in. On a
    // cold dev compile the scan could catch it mid-fade, and half-opaque text
    // fails colour contrast. Scan the settled page instead.
    await expect(page.locator(".vhs-loader")).toHaveCount(0);

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

  test("og:url, JSON-LD and the sitemap use the canonical URL", async ({
    page,
    request,
  }) => {
    await page.goto("/");

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    const canonicalUrl = new URL(canonical!).href;

    // Compared as parsed URLs: "https://x.app" and "https://x.app/" are the
    // same page, and what matters is that every tag names that one page.
    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute("content");
    expect(new URL(ogUrl!).href).toBe(canonicalUrl);

    const jsonLd = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}"
    );
    expect(jsonLd.url).toBe(canonicalUrl);
    // Web only until the apps are in the stores.
    expect(jsonLd.operatingSystem).toBe("Web");

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`<loc>${canonicalUrl}</loc>`);
  });
});

test.describe("Skip link", () => {
  test("is the first stop for keyboard users and moves focus to main", async ({
    browserName,
    page,
  }) => {
    await page.goto("/");

    // Safari's default skips links on Tab; Option+Tab is how its keyboard
    // users reach them.
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
    const skipLink = page.getByRole("link", { name: "Skip to content" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });
});
