import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { switchToDarkMode } from "./helpers/theme";

// Signed out, as a member following a confirmation link would usually be.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Email confirmation", () => {
  test("A link without a token sends the member to sign in", async ({
    page,
  }) => {
    await page.goto("/auth/confirm");
    await expect(page).toHaveURL(/\/login\?message=/);
    await expect(page.getByText(/confirmation link has expired/)).toBeVisible();
  });

  test("An invalid token sends the member to sign in", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "calls Supabase auth; one browser covers it"
    );
    await page.goto("/auth/confirm?token_hash=not-a-real-token&type=email");
    await expect(page).toHaveURL(/\/login\?message=/);
    await expect(page.getByText(/confirmation link has expired/)).toBeVisible();
  });

  test("Shows the confirmed notice once and is accessible", async ({
    page,
  }) => {
    // Scoped to the notice: the home page behind it is covered by its own
    // spec, and its loading animation can still be running here.
    const scanNotice = () =>
      new AxeBuilder({ page }).include("#email-confirmed-notice").analyze();
    const notice = page
      .getByRole("status")
      .filter({ hasText: "Your email is confirmed" });

    await page.goto("/?confirmed=1");
    await expect(notice).toBeVisible();
    // The flag is dropped, so a reload doesn't show it again.
    await expect(page).toHaveURL((url) => !url.searchParams.has("confirmed"));
    expect((await scanNotice()).violations).toEqual([]);

    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(notice).toHaveCount(0);

    // Dark mode: the helper reloads, which correctly drops the notice, so
    // arrive from the confirmation link again.
    await switchToDarkMode(page);
    await expect(notice).toHaveCount(0);
    await page.goto("/?confirmed=1");
    await expect(notice).toBeVisible();
    expect((await scanNotice()).violations).toEqual([]);
  });

  test("Shows nothing without the flag", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Your email is confirmed")).toHaveCount(0);
  });
});

test.describe("Show password", () => {
  test("Toggles the password field on sign-in", async ({ page }) => {
    await page.goto("/login");
    const field = page.getByLabel("Password", { exact: true });
    await expect(field).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(field).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(field).toHaveAttribute("type", "password");
  });
});
