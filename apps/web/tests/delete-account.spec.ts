import AxeBuilder from "@axe-core/playwright";
import { BRAND } from "@moviewatchlist/shared";
import { type Page, expect, test } from "@playwright/test";

import { switchToDarkMode } from "./helpers/theme";

/**
 * The delete-account Edge Function is intercepted in every test here: the
 * browser projects share one E2E account, and deleting it for real would
 * break the rest of the suite. What's under test is the page's side — the
 * confirm step, the call, and what happens after it answers. The function
 * itself is checked with `npx deno check`.
 *
 * The page signs out afterwards with scope "local", but supabase-js still
 * calls the logout endpoint, which would revoke the shared session for every
 * other test. That call is intercepted too.
 */
const FUNCTION_URL = "**/functions/v1/delete-account";
const LOGOUT_URL = "**/auth/v1/logout**";

/**
 * Types the confirmation and waits for the button to enable. Retried because
 * the page is server rendered: typing that lands before React hydrates never
 * reaches state, and WebKit under a parallel run often gets there first.
 */
async function confirmDeletion(page: Page) {
  const button = page.getByRole("button", { name: "Delete account" });
  await expect(async () => {
    await page.getByLabel("Type DELETE to confirm").fill("DELETE");
    await expect(button).toBeEnabled({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  // Enabling it fades it in from 50% opacity; wait for the settled colours.
  await expect(button).toHaveCSS("opacity", "1");
  return button;
}

test.describe("Delete account", () => {
  test("stays disabled until DELETE is typed", async ({ page }) => {
    await page.goto("/profile");

    const button = page.getByRole("button", { name: "Delete account" });
    await expect(button).toBeDisabled();

    const confirm = page.getByLabel("Type DELETE to confirm");
    await confirm.fill("delete it");
    await expect(button).toBeDisabled();

    await confirmDeletion(page);
  });

  test("signs out and says so once the account is deleted", async ({
    page,
  }) => {
    let called = false;
    await page.route(FUNCTION_URL, (route) => {
      called = route.request().method() === "POST";
      return route.fulfill({ json: { deleted: true } });
    });
    await page.route(LOGOUT_URL, (route) => route.fulfill({ status: 204 }));

    await page.goto("/profile");
    await (await confirmDeletion(page)).click();

    await expect(page).toHaveURL(/\/$/);
    expect(called).toBe(true);
    await expect(
      page.getByText("Your account has been deleted.")
    ).toBeVisible();
    // Signed out: the header offers sign-in again.
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("keeps the member signed in and explains when it fails", async ({
    page,
  }) => {
    await page.route(FUNCTION_URL, (route) =>
      route.fulfill({ body: "Could not close billing", status: 502 })
    );

    await page.goto("/profile");
    await (await confirmDeletion(page)).click();

    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveText(
      `We couldn't delete your account. Try again, or email ${BRAND.contactEmail} and we'll do it for you.`
    );
    await expect(page).toHaveURL(/\/profile$/);
    await expect(
      page.getByRole("button", { name: "Delete account" })
    ).toBeEnabled();
  });

  test("has no detectable accessibility issues", async ({ page }) => {
    const section = "section[aria-labelledby='delete-account-heading']";

    await page.goto("/profile");
    await confirmDeletion(page);
    const light = await new AxeBuilder({ page }).include(section).analyze();
    expect(light.violations).toEqual([]);

    await switchToDarkMode(page);
    await confirmDeletion(page);
    const dark = await new AxeBuilder({ page }).include(section).analyze();
    expect(dark.violations).toEqual([]);
  });
});
