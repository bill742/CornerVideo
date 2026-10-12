import { expect, test } from "@playwright/test";

// Tom Hanks — stable, well-known TMDB entry (ID 31)
const KNOWN_PERSON_ID = "31";
const KNOWN_PERSON_NAME = "Tom Hanks";

// The Dark Knight (ID 155) — used to test navigation from movie to person
const KNOWN_MOVIE_ID = "155";

test.describe("Cast and crew person page", () => {
  test("Displays details for a valid person", async ({ page }) => {
    await page.goto(`/cast-and-crew/${KNOWN_PERSON_ID}`);

    // Browser tab title includes person name
    await expect(page).toHaveTitle(new RegExp(KNOWN_PERSON_NAME));

    // Main name heading
    await expect(
      page.getByRole("heading", { level: 1, name: KNOWN_PERSON_NAME })
    ).toBeVisible();

    // IMDb link is present
    await expect(
      page.getByRole("link", { name: "View on IMDb" })
    ).toBeVisible();

    // Acting filmography section is present
    await expect(page.getByRole("heading", { name: "Acting" })).toBeVisible();

    // At least one movie card link is visible in the Acting section
    const actingSection = page
      .getByRole("heading", { name: "Acting" })
      .locator("xpath=ancestor::section[1]");
    await expect(actingSection.getByRole("link").first()).toBeVisible();
  });

  test("Displays an error for a non-existent person ID", async ({ page }) => {
    await page.goto("/cast-and-crew/999999999");

    await expect(
      page.getByRole("heading", { name: "Person not found" })
    ).toBeVisible();
  });

  test("Navigating to a person from a movie detail page loads their page", async ({
    page,
  }) => {
    await page.goto(`/movies/${KNOWN_MOVIE_ID}`);

    // Find the first cast member link on the page
    const firstPersonLink = page.locator('a[href^="/cast-and-crew/"]').first();

    const href = await firstPersonLink.getAttribute("href");
    await firstPersonLink.click();

    // URL should have changed to a cast-and-crew page
    await page.waitForURL(/\/cast-and-crew\/\d+/);
    expect(page.url()).toContain(href);

    // A person name heading should be visible
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
