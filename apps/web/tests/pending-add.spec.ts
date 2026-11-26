import { type Page, expect, test } from "@playwright/test";

const PENDING_ADD_KEY = "cv_pending_add";

/**
 * Signed-in tests share one Supabase account across the three browser
 * projects, so each takes its own title, distinct from watchlist.spec's.
 */
const TITLES: Record<string, number> = {
  chromium: 680, // Pulp Fiction
  firefox: 238, // The Godfather
  webkit: 550, // Fight Club
};

function titleFor(projectName: string) {
  const id = TITLES[projectName];
  if (!id) throw new Error(`No pending-add title for project ${projectName}`);
  return { id, path: `/movies/${id}` };
}

const shelfToggle = (page: Page) =>
  page.getByRole("button", { name: /^(Add to shelf|Remove from shelf)$/ });

/** Leaves the title off the shelf, whatever state it was in. */
async function ensureOffShelf(page: Page, path: string) {
  await page.goto(path);
  const toggle = shelfToggle(page);
  await expect(toggle).toBeVisible({ timeout: 20_000 });
  if ((await toggle.innerText()).trim() === "Remove from shelf") {
    await toggle.click();
    await expect(toggle).toHaveAccessibleName("Add to shelf", {
      timeout: 15_000,
    });
  }
}

test.describe("Add to shelf while signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("leads to sign-up, remembers the title and keeps the way back", async ({
    page,
  }) => {
    await page.goto("/movies/155");

    const add = page.getByRole("link", { name: "Add to shelf" });
    await expect(add).toBeVisible({ timeout: 20_000 });
    await expect(add).toHaveAttribute("href", "/signup?next=%2Fmovies%2F155");

    await add.click();
    await page.waitForURL(/\/signup\?next=%2Fmovies%2F155/);

    const pending = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      PENDING_ADD_KEY
    );
    expect(JSON.parse(pending ?? "null")).toMatchObject({
      mediaType: "movie",
      tmdbId: 155,
    });

    await expect(
      page.getByRole("main").getByRole("link", { exact: true, name: "Sign in" })
    ).toHaveAttribute("href", "/login?next=%2Fmovies%2F155");
  });

  test("an unsafe next is dropped from the sign-in link", async ({ page }) => {
    await page.goto("/signup?next=//evil.example");
    await expect(
      page.getByRole("main").getByRole("link", { exact: true, name: "Sign in" })
    ).toHaveAttribute("href", "/login?next=%2Fmovies");
  });
});

test.describe("A pending add after signing in", () => {
  // Adds and removes rows on the shared account.
  test.describe.configure({ mode: "serial" });

  test("is added wherever sign-in lands, with a link to the title", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const { id, path } = titleFor(testInfo.project.name);
    await ensureOffShelf(page, path);

    // What the signed-out click stored, as if the member has just signed in
    // and landed on Browse. Seeded once, so later navigations don't re-add.
    await page.addInitScript(
      ([key, tmdbId]) => {
        if (window.sessionStorage.getItem("seeded")) return;
        window.sessionStorage.setItem("seeded", "1");
        window.localStorage.setItem(
          key as string,
          JSON.stringify({ mediaType: "movie", savedAt: Date.now(), tmdbId })
        );
      },
      [PENDING_ADD_KEY, id] as const
    );

    try {
      await page.goto("/movies");

      const notice = page
        .getByRole("status")
        .filter({ hasText: "Added to your shelf." });
      await expect(notice).toBeVisible({ timeout: 20_000 });
      expect(
        await page.evaluate(
          (key) => window.localStorage.getItem(key),
          PENDING_ADD_KEY
        )
      ).toBeNull();

      await notice.getByRole("link", { name: "Go to the title" }).click();
      await page.waitForURL(new RegExp(`${path}$`));
      await expect(shelfToggle(page)).toHaveAccessibleName(
        "Remove from shelf",
        { timeout: 20_000 }
      );
    } finally {
      await ensureOffShelf(page, path);
    }
  });
});
