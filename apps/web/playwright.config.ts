import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// Load .env into the test-runner process so process.env vars (e.g.
// NEXT_PUBLIC_SITE_URL) are available in test files, just as Next.js
// loads them for the dev server. In CI, env vars come from the environment
// directly and .env won't exist, so the error is safely swallowed.
try {
  process.loadEnvFile(path.resolve(__dirname, ".env"));
} catch {
  // .env not present (CI or missing file) — env vars must be set externally
}

/** Where auth.setup.ts writes the signed-in session. Gitignored — it holds a
 * live token. */
export const AUTH_STATE = "playwright/.auth/user.json";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    // `next dev` compiles each route on its first request, which on a CI
    // runner pushed page.goto past the 30s timeout. CI serves a production
    // build instead — the workflow runs `build` in an earlier step — which is
    // both faster and closer to what actually ships.
    command: process.env.CI ? "pnpm run start" : "pnpm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  /* Configure projects for major browsers */
  projects: [
    // Signs in once and writes the session to playwright/.auth/user.json.
    // Every browser project depends on it and reuses that state, so the
    // protected routes are reachable without logging in per test.
    { name: "setup", testMatch: /auth\.setup\.ts/ },

    {
      dependencies: ["setup"],
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_STATE },
    },

    {
      dependencies: ["setup"],
      name: "firefox",
      use: { ...devices["Desktop Firefox"], storageState: AUTH_STATE },
    },

    {
      dependencies: ["setup"],
      name: "webkit",
      use: { ...devices["Desktop Safari"], storageState: AUTH_STATE },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
});
