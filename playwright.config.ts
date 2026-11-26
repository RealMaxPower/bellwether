import { defineConfig, devices } from "@playwright/test";

// End-to-end smoke tests (e2e/). Two targets:
//
//   npm run test:e2e        — against a local production server. Run
//                             `npm run build` first; the server is started
//                             for you on port 3100.
//   npm run test:e2e:prod   — against the live site. Use after every
//                             production merge: some failures only happen on
//                             Vercel (e.g. a file missing from a function
//                             bundle), and a local `next start` can't see them.
//
// Set E2E_BASE_URL to point at any other deployment.
const PORT = 3100;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    // Below the lg breakpoint the primary nav collapses into a menu sheet.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run start -- -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
