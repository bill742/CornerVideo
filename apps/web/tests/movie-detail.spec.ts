import { expect, test } from "@playwright/test";

// The Dark Knight — stable, well-known TMDB entry (ID 155)
const KNOWN_MOVIE_ID = "155";
const KNOWN_MOVIE_TITLE = "The Dark Knight";
const KNOWN_MOVIE_YEAR = "2008";

test.describe("Movie detail page", () => {
  test("Displays details for a valid movie", async ({ page }) => {
    await page.goto(`/movies/${KNOWN_MOVIE_ID}`);

    // Browser tab title includes movie name and year
    await expect(page).toHaveTitle(
      new RegExp(`${KNOWN_MOVIE_TITLE}.*${KNOWN_MOVIE_YEAR}`)
    );

    // Main movie title heading
    await expect(
      page.getByRole("heading", { name: KNOWN_MOVIE_TITLE })
    ).toBeVisible();

    // Release year appears in the metadata row
    await expect(page.getByText(KNOWN_MOVIE_YEAR).first()).toBeVisible();

    // Overview section is present
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  });

  test("Displays an error for a non-existent movie ID", async ({ page }) => {
    await page.goto("/movies/999999999");

    await expect(
      page.getByRole("heading", { name: "Movie not found" })
    ).toBeVisible();

    await expect(
      page.getByText(
        "The requested movie could not be found or failed to load from the database."
      )
    ).toBeVisible();
  });

  test("Navigating to a movie from the home page loads its detail page", async ({
    page,
  }) => {
    await page.goto("./");

    // Click the first movie card on the home page
    const firstMovieLink = page
      .getByRole("heading", { name: "In Theatres" })
      .locator("xpath=ancestor::section[1]")
      .getByRole("link")
      .first();

    const href = await firstMovieLink.getAttribute("href");
    await firstMovieLink.click();

    // URL should have changed to a movie detail page
    await page.waitForURL(/\/movies\/\d+/);
    expect(page.url()).toContain(href);

    // A movie title heading should be visible
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
