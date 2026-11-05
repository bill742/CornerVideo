import AxeBuilder from "@axe-core/playwright";
import { BRAND, FREE_WATCHLIST_LIMIT } from "@moviewatchlist/shared";
import { expect, test } from "@playwright/test";

import { switchToDarkMode } from "./helpers/theme";

// Signed out, as a new visitor would see them.
test.use({ storageState: { cookies: [], origins: [] } });

const PAGES = [
  { path: "/signup", title: `Create your account | ${BRAND.name}` },
  { path: "/login", title: `Sign in | ${BRAND.name}` },
];

for (const { path, title } of PAGES) {
  test.describe(`${path} metadata`, () => {
    test("has its own title and canonical", async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveTitle(title);

      // Not the root layout's "/", which would claim this is the homepage.
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(new URL(canonical!).pathname).toBe(path);
    });

    test("has no detectable accessibility issues", async ({ page }) => {
      await page.goto(path);

      const light = await new AxeBuilder({ page }).analyze();
      expect(light.violations).toEqual([]);

      await switchToDarkMode(page);
      const dark = await new AxeBuilder({ page }).analyze();
      expect(dark.violations).toEqual([]);
    });
  });
}

test("Sign-up states the free shelf limit", async ({ page }) => {
  await page.goto("/signup");

  await expect(
    page.getByText(`Free: ${FREE_WATCHLIST_LIMIT} titles on your shelf.`)
  ).toBeVisible();
});
