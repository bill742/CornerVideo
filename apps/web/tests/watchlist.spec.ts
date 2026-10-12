import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

/**
 * The browser projects share one test account against the real Supabase
 * project, so each takes distinct ids — otherwise one project's cleanup
 * deletes another's fixture mid-run. Six rows total stays well under
 * FREE_WATCHLIST_LIMIT (25), which addToWatchlist enforces.
 */
const FIXTURES: Record<string, { movie: number; tv: number }> = {
  chromium: { movie: 155, tv: 1399 },
  firefox: { movie: 27205, tv: 1396 },
  webkit: { movie: 603, tv: 66732 },
};

function fixturesFor(projectName: string) {
  const ids = FIXTURES[projectName];
  if (!ids)
    throw new Error(`No watchlist fixture ids for project ${projectName}`);
  return {
    moviePath: `/movies/${ids.movie}`,
    tvPath: `/tv/${ids.tv}`,
    ...ids,
  };
}

/**
 * Drives the detail-page toggle until the stored state matches, which is all a
 * fixture needs — the button's own re-render is pinned by a separate spec.
 *
 * This used to reload in a retry loop because the button was server rendered
 * and therefore clickable before React attached its handler, silently dropping
 * the click. It resolves its own session and row in the browser now, so it does
 * not exist until React has mounted it — once it is visible the handler is
 * attached, and the loop was only costing time.
 *
 * What it does need is patience. The button appears two network round trips
 * after the HTML (auth, then the watchlist lookup), and on a production build
 * the page itself is served from cache, so the markup lands long before the
 * button does.
 */
async function setWatchlisted(page: Page, path: string, wanted: boolean) {
  const target = wanted ? "Remove from shelf" : "Add to shelf";

  await page.goto(path);

  const toggle = page.getByRole("button", {
    name: /^(Add to shelf|Remove from shelf)$/,
  });
  await expect(toggle).toBeVisible({ timeout: 20_000 });

  if ((await toggle.innerText()).trim() !== target) {
    await toggle.click();

    // The label flips only after the server action resolves, so this confirms
    // the write landed rather than just a local state change.
    await expect(toggle).toHaveAccessibleName(target, { timeout: 15_000 });
  }
}

/** Rows are matched by link href so the assertions do not depend on TMDB copy. */
function rowFor(page: Page, href: string) {
  return page.locator("li").filter({ has: page.locator(`a[href="${href}"]`) });
}

test.describe("Watchlist", () => {
  // These tests add and remove rows on one shared Supabase account, so running
  // them concurrently makes each one see the others' writes: beforeEach adds a
  // fixture that a sibling has already removed, and rows vanish mid-assertion.
  // CI never saw it (`workers: 1`), but locally `fullyParallel` spreads them
  // across four workers and they fail in a different combination every run.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }, testInfo) => {
    // The default 30s covers the hook and the test together, and this hook
    // alone primes two fixtures that each wait on client-side auth. Under the
    // old budget a slow fixture consumed the whole allowance and the test timed
    // out before its own first assertion — the failure then pointed at the
    // watchlist page while the snapshot showed a detail page.
    test.setTimeout(120_000);

    const { moviePath, tvPath } = fixturesFor(testInfo.project.name);
    await setWatchlisted(page, moviePath, true);
    await setWatchlisted(page, tvPath, true);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const { moviePath, tvPath } = fixturesFor(testInfo.project.name);
    await setWatchlisted(page, moviePath, false);
    await setWatchlisted(page, tvPath, false);
  });

  test("Lists movies and TV shows under their tabs", async ({
    page,
  }, testInfo) => {
    const { moviePath, tvPath } = fixturesFor(testInfo.project.name);

    await page.goto("/watchlist");

    // Movies is the default tab, matching the mobile app.
    await expect(rowFor(page, moviePath)).toBeVisible();
    await expect(rowFor(page, tvPath)).toHaveCount(0);

    // The web page once dropped shows entirely while still counting them.
    await page.getByRole("button", { exact: true, name: "TV Shows" }).click();
    await expect(rowFor(page, tvPath)).toBeVisible();
    await expect(rowFor(page, moviePath)).toHaveCount(0);
  });

  test("Status filter narrows the list", async ({ page }, testInfo) => {
    const { moviePath } = fixturesFor(testInfo.project.name);

    await page.goto("/watchlist");
    await expect(rowFor(page, moviePath)).toBeVisible();

    // Newly added rows default to "want to watch", so this must hide it.
    await page.getByRole("button", { exact: true, name: "Watched" }).click();
    await expect(rowFor(page, moviePath)).toHaveCount(0);

    await page.getByRole("button", { exact: true, name: "All" }).click();
    await expect(rowFor(page, moviePath)).toBeVisible();
  });

  test("Item count matches the rows shown", async ({ page }) => {
    await page.goto("/watchlist");

    const rows = await page.getByRole("listitem").count();
    await expect(page.getByText(new RegExp(`^${rows} items?$`))).toBeVisible();
  });

  test("Removing an item takes it off the list", async ({ page }, testInfo) => {
    const { tvPath } = fixturesFor(testInfo.project.name);

    await page.goto("/watchlist");
    await page.getByRole("button", { exact: true, name: "TV Shows" }).click();

    const row = rowFor(page, tvPath);
    await row.getByRole("button", { name: /^Remove / }).click();

    await expect(row).toHaveCount(0);
  });

  test("Watch status survives a reload", async ({ page }, testInfo) => {
    const { moviePath } = fixturesFor(testInfo.project.name);

    await page.goto("/watchlist");

    // Retried because the select is server rendered, so a change landing before
    // React attaches is dropped. The assertion runs after a reload so it
    // reflects what was stored, not the value the browser painted locally.
    await expect(async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");

      const status = rowFor(page, moviePath).getByRole("combobox");
      await expect(status).toBeVisible({ timeout: 5_000 });
      await status.selectOption("watching");
      await expect(status).toHaveValue("watching", { timeout: 2_000 });

      // Changing the select fires a server action; reloading straight away
      // aborts that request and the write never lands.
      await page.waitForLoadState("networkidle");

      await page.reload();
      await expect(rowFor(page, moviePath).getByRole("combobox")).toHaveValue(
        "watching",
        { timeout: 3_000 }
      );
    }).toPass({ timeout: 45_000 });
  });

  test("Detail-page toggle updates without a reload", async ({
    page,
  }, testInfo) => {
    const { tvPath } = fixturesFor(testInfo.project.name);

    await page.goto(tvPath);
    // Settle first so this covers the relabel, not the pre-hydration click
    // window that setWatchlisted deliberately retries through.
    await page.waitForLoadState("networkidle");

    // beforeEach leaves this one added, so the button starts as "Remove from shelf".
    await page.getByRole("button", { name: "Remove from shelf" }).click();

    await expect(
      page.getByRole("button", { name: "Add to shelf" })
    ).toBeVisible();
  });

  test("Should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    await page.goto("/watchlist");

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
