import AxeBuilder from "@axe-core/playwright";
import { BRAND } from "@moviewatchlist/shared";
import { type Page, expect, test } from "@playwright/test";

import { switchToDarkMode } from "./helpers/theme";

// Password reset is for signed-out members; the shared session would turn the
// tokenless reset page into the signed-in retry form.
test.use({ storageState: { cookies: [], origins: [] } });

// Never submits the request form: that sends a real email, and Supabase's
// built-in mailer allows only a few an hour.

async function expectNoAxeViolations(page: Page) {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await switchToDarkMode(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
}

test.describe("Forgot password", () => {
  test("Sign-in page links to it", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Forgot password" })
    ).toBeVisible();
  });

  test("Has metadata and no accessibility issues", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page).toHaveTitle(`Forgot password | ${BRAND.name}`);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send reset link" })
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("Shows the sent confirmation without the form", async ({ page }) => {
    await page.goto("/forgot-password?sent=1");
    await expect(
      page.getByRole("status").filter({ hasText: "If there" })
    ).toContainText("If there's an account for that email");
    await expect(page.getByLabel("Email")).toHaveCount(0);
  });
});

test.describe("Reset password", () => {
  test("Without a link token, offers a new link", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page).toHaveTitle(`Reset password | ${BRAND.name}`);
    await expect(
      page.getByRole("alert").filter({ hasText: /\S/ }).first()
    ).toContainText("incomplete or has expired");
    await page.getByRole("link", { name: "Send a new link" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });

  test("With a link token, shows the form and is accessible", async ({
    page,
  }) => {
    await page.goto("/reset-password?token_hash=test-token&type=recovery");
    await expect(
      page.getByLabel("New password", { exact: true })
    ).toBeVisible();
    await expect(page.getByLabel("Confirm new password")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow"
    );
    await expectNoAxeViolations(page);
  });

  test("Rejects mismatched passwords and keeps the token", async ({ page }) => {
    await page.goto("/reset-password?token_hash=test-token&type=recovery");
    await page.getByLabel("New password", { exact: true }).fill("first-pass1");
    await page.getByLabel("Confirm new password").fill("second-pass2");
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: /\S/ }).first()
    ).toHaveText("The passwords don't match.");
    await expect(page).toHaveURL(/token_hash=test-token/);
    await expect(
      page.getByLabel("New password", { exact: true })
    ).toBeVisible();
  });

  test("An invalid token sends the member to request a new link", async ({
    page,
  }, testInfo) => {
    // Calls Supabase to verify the token; once is enough.
    test.skip(
      testInfo.project.name !== "chromium",
      "calls Supabase auth; one browser covers it"
    );

    await page.goto(
      "/reset-password?token_hash=not-a-real-token&type=recovery"
    );
    await page.getByLabel("New password", { exact: true }).fill("new-pass-123");
    await page.getByLabel("Confirm new password").fill("new-pass-123");
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(page).toHaveURL(/\/forgot-password\?error=/);
    await expect(
      page.getByRole("alert").filter({ hasText: /\S/ }).first()
    ).toContainText("expired or was already used");
  });
});
