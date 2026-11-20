import {
  APP_NEWS_CONSENT_TEXT,
  ATTRIBUTION_COOKIE,
  HEARD_FROM_OPTIONS,
} from "@moviewatchlist/shared";
import { type Page, expect, test } from "@playwright/test";

// A new visitor, as the sign-up flow sees them.
test.use({ storageState: { cookies: [], origins: [] } });

async function attributionCookie(page: Page) {
  const cookie = (await page.context().cookies()).find(
    ({ name }) => name === ATTRIBUTION_COOKIE
  );
  return cookie ? JSON.parse(decodeURIComponent(cookie.value)) : null;
}

test.describe("Campaign tags", () => {
  test("a tagged link is remembered for sign-up", async ({ page }) => {
    await page.goto(
      "/?utm_source=reddit&utm_medium=social&utm_campaign=launch"
    );

    await expect
      .poll(() => attributionCookie(page))
      .toEqual({
        utm_campaign: "launch",
        utm_medium: "social",
        utm_source: "reddit",
      });
  });

  test("the first tagged link keeps the credit", async ({ page }) => {
    await page.goto("/?utm_source=reddit");
    await expect
      .poll(() => attributionCookie(page))
      .toEqual({ utm_source: "reddit" });

    await page.goto("/privacy?utm_source=google");
    // Give AttributionCapture's effect a chance to run, then check it didn't
    // overwrite the first touch.
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy" })
    ).toBeVisible();
    expect(await attributionCookie(page)).toEqual({ utm_source: "reddit" });
  });

  test("an untagged visit sets nothing", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy" })
    ).toBeVisible();
    expect(await attributionCookie(page)).toBeNull();
  });
});

test.describe("Sign-up form extras", () => {
  test("asks how you heard about us, optionally", async ({ page }) => {
    await page.goto("/signup");

    const select = page.getByLabel("How did you hear about us? (optional)");
    await expect(select).toHaveValue("");
    await expect(select).not.toHaveAttribute("required");

    const options = await select.locator("option").allTextContents();
    expect(options).toEqual([
      "Choose one",
      ...HEARD_FROM_OPTIONS.map(({ label }) => label),
    ]);
  });

  test("leaves the app-news box unticked", async ({ page }) => {
    await page.goto("/signup");

    // CASL needs an opt-in the member makes themselves.
    const optIn = page.getByLabel(APP_NEWS_CONSENT_TEXT);
    await expect(optIn).not.toBeChecked();
    await optIn.check();
    await expect(optIn).toBeChecked();
  });
});
