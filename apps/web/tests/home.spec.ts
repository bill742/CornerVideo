import { expect, test } from "@playwright/test";

const ROWS = ["In Theatres", "New on Digital", "Coming Soon"];

test.describe("Home page", () => {
  test("Displays the release rows with movies in each", async ({ page }) => {
    await page.goto("./");

    for (const name of ROWS) {
      const heading = page.getByRole("heading", { name });
      await expect(heading).toBeVisible();

      const section = heading.locator("xpath=ancestor::section[1]");
      await expect(section.getByRole("link").first()).toBeVisible();
    }
  });

  test("A film in theaters is not repeated under New on Digital", async ({
    page,
  }) => {
    await page.goto("./");

    const hrefsIn = async (name: string) =>
      page
        .getByRole("heading", { name })
        .locator("xpath=ancestor::section[1]")
        .getByRole("link")
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("href") ?? "")
        );

    await expect(page.getByRole("heading", { name: ROWS[1] })).toBeVisible();

    const theatrical = await hrefsIn(ROWS[0]);
    const digital = await hrefsIn(ROWS[1]);

    // Both rows come from the same window, so a film with a theatrical and a
    // digital release lands in both until the loader filters it out.
    expect(theatrical.length).toBeGreaterThan(0);
    expect(digital.filter((href) => theatrical.includes(href))).toEqual([]);
  });
});
