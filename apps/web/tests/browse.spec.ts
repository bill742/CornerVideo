import { expect, test } from "@playwright/test";

const MOVIE_ROWS = ["In Theatres", "New on Digital", "Coming Soon"];

test.describe("Browse", () => {
  test("The movies aisle shows the release rows with movies in each", async ({
    page,
  }) => {
    await page.goto("/movies");

    await expect(
      page.getByRole("heading", { level: 1, name: "Browse the aisles" })
    ).toBeVisible();

    for (const name of MOVIE_ROWS) {
      const heading = page.getByRole("heading", { name });
      await expect(heading).toBeVisible();

      const section = heading.locator("xpath=ancestor::section[1]");
      await expect(section.getByRole("link").first()).toBeVisible();
    }
  });

  test("A film in theatres is not repeated under New on Digital", async ({
    page,
  }) => {
    await page.goto("/movies");

    const hrefsIn = async (name: string) =>
      page
        .getByRole("heading", { name })
        .locator("xpath=ancestor::section[1]")
        .getByRole("link")
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("href") ?? "")
        );

    await expect(
      page.getByRole("heading", { name: MOVIE_ROWS[1] })
    ).toBeVisible();

    const theatrical = await hrefsIn(MOVIE_ROWS[0]);
    const digital = await hrefsIn(MOVIE_ROWS[1]);

    // Both rows come from the same window, so a film with a theatrical and a
    // digital release lands in both until the loader filters it out.
    expect(theatrical.length).toBeGreaterThan(0);
    expect(digital.filter((href) => theatrical.includes(href))).toEqual([]);
  });

  test("The aisle switch links between /movies and /tv", async ({ page }) => {
    await page.goto("/movies");
    const aisles = page.getByRole("navigation", { name: "Aisles" });

    await expect(aisles.getByRole("link", { name: "Movies" })).toHaveAttribute(
      "aria-current",
      "page"
    );

    await aisles.getByRole("link", { name: "TV Shows" }).click();
    await expect(page).toHaveURL(/\/tv$/);
    await expect(
      page
        .getByRole("navigation", { name: "Aisles" })
        .getByRole("link", { name: "TV Shows" })
    ).toHaveAttribute("aria-current", "page");
    // The TV rows load in the browser; the first poster link proves they did.
    await expect(
      page.locator("main section").first().getByRole("link").first()
    ).toBeVisible();
  });

  test("The header's Browse link goes to the movies aisle", async ({
    page,
  }) => {
    await page.goto("/privacy");
    await page
      .getByRole("banner")
      .getByRole("link", { exact: true, name: "Browse" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/movies$/);
  });
});

test.describe("Browse metadata", () => {
  for (const { path, title } of [
    { path: "/movies", title: "Upcoming Movies & Release Dates" },
    { path: "/tv", title: "TV Premiere Dates" },
  ]) {
    test(`${path} has its own title and canonical`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(
        new RegExp(`^${title.replace("&", "\\&")} \\|`)
      );
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(new URL(canonical!).pathname).toBe(path);
    });
  }

  test("robots allows the aisles but still blocks detail pages", async ({
    request,
  }) => {
    const robots = await (await request.get("/robots.txt")).text();
    const disallowed = robots
      .split("\n")
      .filter((line) => line.startsWith("Disallow:"))
      .map((line) => line.replace("Disallow:", "").trim());

    expect(disallowed).toContain("/movies/");
    expect(disallowed).toContain("/tv/");
    // Robots rules are prefix matches, so neither may be a bare aisle path.
    expect(disallowed).not.toContain("/movies");
    expect(disallowed).not.toContain("/tv");
  });

  test("the sitemap lists both aisles", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toMatch(/<loc>[^<]*\/movies<\/loc>/);
    expect(sitemap).toMatch(/<loc>[^<]*\/tv<\/loc>/);
  });
});

test.describe("Signed-in members skip the landing page", () => {
  // The browser projects run signed in (auth.setup.ts).
  test("visiting / lands on /movies", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/movies$/);
  });
});
