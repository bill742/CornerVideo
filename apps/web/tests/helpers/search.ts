import { type Page, expect } from "@playwright/test";

/**
 * Submits the header search and waits for the results page to render.
 *
 * Hydration re-renders the controlled input from state (""), wiping a fill that
 * landed first — so the fill is retried until the clear button appears, which
 * only happens once React holds the term. Matching on the parsed term rather
 * than a regex stops an empty term slipping through, which is otherwise
 * invisible: /search?term= satisfies the URL check and the test fails later,
 * hunting results that were never requested.
 */
export async function submitSearch(page: Page, term: string) {
  const input = page.getByRole("textbox", {
    name: "Search movies and TV shows",
  });
  const clearButton = page.getByRole("button", { name: "Clear search" });

  await expect(async () => {
    await input.fill(term);
    await expect(clearButton).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  await page
    .getByRole("button", { name: "Search movies and TV shows" })
    .click();

  await page.waitForURL(
    (url) => url.pathname === "/search" && url.searchParams.get("term") === term
  );

  // waitForURL resolves on the URL change alone; the new document arrives
  // afterwards. Without this an axe scan runs against a blank page.
  await expect(page).toHaveTitle(/search results/i);
}
