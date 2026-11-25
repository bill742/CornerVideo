import AxeBuilder from "@axe-core/playwright";
import {
  APP_NEWS_CONSENT_TEXT,
  BRAND,
  FREE_WATCHLIST_LIMIT,
} from "@moviewatchlist/shared";
import { expect, test } from "@playwright/test";

import { switchToDarkMode } from "./helpers/theme";

// The landing page is for new visitors; members are redirected to /movies.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Landing page", () => {
  test("explains the app and offers both ways in", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: BRAND.tagline })
    ).toBeVisible();
    await expect(
      page.getByText(`Your first ${FREE_WATCHLIST_LIMIT} titles are free.`)
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Start your shelf — free" })
    ).toHaveAttribute("href", "/signup");
    await page.getByRole("link", { name: "Browse the aisles" }).click();
    await expect(page).toHaveURL(/\/movies$/);
  });

  test("puts its explanation in the server-rendered HTML", async ({
    request,
  }) => {
    // What a crawler gets before any JavaScript runs.
    const html = await (await request.get("/")).text();
    expect(html).toContain("How it works");
    expect(html).toContain("Start your shelf");
    expect(html).toContain("Coming Soon");
  });

  test("shows a Coming Soon row that links to titles", async ({ page }) => {
    await page.goto("/");
    const row = page
      .getByRole("heading", { name: "Coming Soon" })
      .locator("xpath=ancestor::section[1]");
    await expect(row.getByRole("link").first()).toHaveAttribute(
      "href",
      /^\/movies\/\d+$/
    );
  });

  test("has no detectable accessibility issues", async ({ page }) => {
    await page.goto("/");
    const light = await new AxeBuilder({ page }).analyze();
    expect(light.violations).toEqual([]);

    await switchToDarkMode(page);
    const dark = await new AxeBuilder({ page }).analyze();
    expect(dark.violations).toEqual([]);
  });
});

test.describe("Waitlist form", () => {
  test("needs an email and an explicit opt-in", async ({ page }) => {
    await page.goto("/");

    const email = page.getByLabel("Email", { exact: true });
    await expect(email).toHaveAttribute("required");
    const consent = page.getByLabel(APP_NEWS_CONSENT_TEXT);
    // CASL: unticked until the visitor ticks it.
    await expect(consent).not.toBeChecked();
    await expect(consent).toHaveAttribute("required");
  });

  test("confirms a sign-up", async ({ page }) => {
    await page.goto("/");

    // Fill the honeypot as well: the action answers exactly as for a real
    // sign-up but writes nothing, so this run doesn't add test addresses to
    // the real waitlist. join_waitlist() itself is covered by the migration
    // checks.
    await page.locator('input[name="website"]').fill("bot");
    await page.getByLabel("Email", { exact: true }).fill("e2e@example.com");
    await page.getByLabel(APP_NEWS_CONSENT_TEXT).check();

    // Retried: a click before hydration submits the form natively, which
    // also works, but the status line is what proves the action answered.
    await page.getByRole("button", { name: "Notify me" }).click();
    await expect(page.getByRole("status").filter({ hasText: /\S/ })).toHaveText(
      "You're on the list. We'll email you when there's news."
    );
  });
});
