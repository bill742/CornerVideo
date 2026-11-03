import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const DEFAULT = "US";

test.describe("Profile", () => {
  // `updateProfile` writes region *and* theme from a single form, so the two
  // saving tests below both rewrite the whole profile row. Run in parallel, the
  // theme test submits its own stale region value and clobbers the region the
  // other test just saved — which then fails on reload. Serial keeps each
  // save/read pair intact. The skip above guards across projects; this guards
  // within one.
  test.describe.configure({ mode: "serial" });

  test("Saving preferences keeps the chosen region selected", async ({
    page,
  }, testInfo) => {
    // Unlike the watchlist, there is one profile row per account and no way to
    // partition it per browser, so concurrent projects would overwrite each
    // other mid-assertion. One project exercises the write.
    test.skip(
      testInfo.project.name !== "chromium",
      "mutates the single shared profile row"
    );

    await page.goto("/profile");

    const region = page.locator("#region");
    await expect(region).toBeVisible();
    await region.selectOption("GB");

    await page.getByRole("button", { name: "Save preferences" }).click();
    await expect(page.getByText("Preferences saved")).toBeVisible();

    // The bug: React resets an uncontrolled form once its action resolves, so
    // this snapped back to the previously saved value while the database held
    // the new one.
    await expect(region).toHaveValue("GB");

    await page.reload();
    await expect(page.locator("#region")).toHaveValue("GB");

    // Leave the account as other specs expect to find it.
    await page.locator("#region").selectOption(DEFAULT);
    await page.getByRole("button", { name: "Save preferences" }).click();
    await expect(page.getByText("Preferences saved")).toBeVisible();
  });

  test("Saving a theme applies it", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "mutates the single shared profile row"
    );

    await page.goto("/profile");
    const html = page.locator("html");

    // Theme moved here from a header toggle. The select wrote to the profile
    // row but never told next-themes, so the page kept its old appearance.
    await page.locator("#theme").selectOption("dark");
    await page.getByRole("button", { name: "Save preferences" }).click();
    await expect(page.getByText("Preferences saved")).toBeVisible();

    await expect(html).toHaveClass(/\bdark\b/);

    // And it survives navigation, not just the save.
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    await page.goto("/profile");
    await page.locator("#theme").selectOption("system");
    await page.getByRole("button", { name: "Save preferences" }).click();
    await expect(page.getByText("Preferences saved")).toBeVisible();
  });

  test("Should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    await page.goto("/profile");
    await expect(page.locator("#region")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
  // The Premium section only renders when Stripe is configured. Locally .env
  // has test keys; CI (like the production Worker for now) has none.
  const billingConfigured = !!process.env.STRIPE_SECRET_KEY;

  test("Shows the Premium section only when billing is configured", async ({
    page,
  }) => {
    await page.goto("/profile");
    await expect(page.locator("#region")).toBeVisible();
    // "Go Premium" for a free account, "Premium" for a subscriber.
    const heading = page.getByRole("heading", { level: 2, name: /Premium$/ });
    if (billingConfigured) {
      await expect(heading).toBeVisible();
    } else {
      await expect(heading).toHaveCount(0);
    }
  });

  test("Says plainly when checkout was cancelled", async ({ page }) => {
    test.skip(
      !billingConfigured,
      "the Premium section is hidden without Stripe"
    );

    await page.goto("/profile?checkout=cancelled");
    await expect(page.getByRole("status")).toHaveText(
      "Checkout was cancelled. You haven't been charged."
    );

    // Shown once: the flag leaves the address so a reload doesn't repeat it.
    await expect(page).toHaveURL(/\/profile$/);
    await page.reload();
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("Ignores unknown billing flags", async ({ page }) => {
    await page.goto("/profile?billing=<script>");
    await expect(page.locator("#region")).toBeVisible();
    // Production builds always include Next's empty route announcer, which
    // has role="alert", so only alerts with text count.
    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(
      0
    );
  });
});
