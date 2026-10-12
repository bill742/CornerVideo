import { type Page, expect } from "@playwright/test";

/**
 * Puts the page in dark mode so a scan can cover it.
 *
 * This used to click the header toggle, which no longer exists — theme is set
 * on the Profile page now. Driving it from there would mean writing to the one
 * profile row the account has, which the browser projects share, so parallel
 * runs would fight over it. Writing the key next-themes reads keeps each test
 * context independent, and these specs are scanning a dark page rather than
 * testing the control that selects it.
 */
export async function switchToDarkMode(page: Page) {
  await page.evaluate(() => window.localStorage.setItem("theme", "dark"));
  await page.reload();

  await expect(page.locator("html")).toHaveClass(/dark/);
  // The reload can paint a route's loading.tsx skeleton first; scanning that
  // reports a page with no content. Every page's title is its <h1>, so its
  // arrival means the streamed content has landed.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}
