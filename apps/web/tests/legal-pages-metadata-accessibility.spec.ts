import AxeBuilder from "@axe-core/playwright";
import { BRAND } from "@moviewatchlist/shared";
import { expect, test } from "@playwright/test";

import { switchToDarkMode } from "./helpers/theme";

const PAGES = [
  { heading: "Privacy Policy", path: "/privacy" },
  { heading: "Terms of Service", path: "/terms" },
];

for (const { heading, path } of PAGES) {
  test.describe(`${heading} page`, () => {
    test("has its own title, heading and canonical", async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveTitle(`${heading} | ${BRAND.name}`);
      await expect(
        page.getByRole("heading", { level: 1, name: heading })
      ).toBeVisible();

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(new URL(canonical!).pathname).toBe(path);
    });

    test("names the contact address", async ({ page }) => {
      await page.goto(path);

      await expect(
        page
          .getByRole("main")
          .locator(`a[href="mailto:${BRAND.contactEmail}"]`)
          .first()
      ).toBeVisible();
    });

    test("has no detectable accessibility issues", async ({ page }) => {
      await page.goto(path);

      const light = await new AxeBuilder({ page }).analyze();
      expect(light.violations).toEqual([]);

      await switchToDarkMode(page);
      const dark = await new AxeBuilder({ page }).analyze();
      expect(dark.violations).toEqual([]);
    });

    test("is listed in the sitemap", async ({ page, request }) => {
      await page.goto(path);
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");

      const sitemap = await (await request.get("/sitemap.xml")).text();
      expect(sitemap).toContain(`<loc>${canonical}</loc>`);
    });
  });
}

test.describe("Footer", () => {
  test("links to Privacy, Terms and Contact", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("navigation", { name: "Footer" });

    await expect(footer.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      `mailto:${BRAND.contactEmail}`
    );

    await footer.getByRole("link", { name: "Privacy" }).click();
    await expect(page).toHaveURL(/\/privacy$/);

    await page
      .getByRole("navigation", { name: "Footer" })
      .getByRole("link", { name: "Terms" })
      .click();
    await expect(page).toHaveURL(/\/terms$/);
  });
});

test.describe("Sign-up consent", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("links to the Terms and Privacy Policy", async ({ page }) => {
    await page.goto("/signup");

    const consent = page.getByText("By creating an account, you agree to");
    await expect(
      consent.getByRole("link", { name: "Terms of Service" })
    ).toHaveAttribute("href", "/terms");
    await expect(
      consent.getByRole("link", { name: "Privacy Policy" })
    ).toHaveAttribute("href", "/privacy");
  });
});

test("Password pages don't claim the homepage's canonical", async ({
  page,
}) => {
  for (const path of ["/forgot-password", "/reset-password"]) {
    await page.goto(path);
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(new URL(canonical!).pathname).toBe(path);
  }
});
