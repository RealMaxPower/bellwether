import { expect, test, type Page } from "@playwright/test";
import { scenarios } from "../src/lib/fed-chair/scenarios";

// Smoke test: every page loads, renders its heading, and finishes without
// console errors, uncaught exceptions or failed same-origin requests. See
// playwright.config.ts for how to run it locally and against production.

const PAGES = [
  "/",
  "/about",
  "/about-the-data",
  "/background",
  "/decompose",
  "/fed-chair",
  "/heatmap",
  "/pmi-explained",
];

// Vercel Analytics loads from /_vercel/insights, which exists only on Vercel.
// Under a local `next start` it 404s, and that is not a site failure.
const isVercelInternal = (url: string) => new URL(url).pathname.startsWith("/_vercel/");

/** Load a page and return every problem seen while it loaded and hydrated. */
async function visit(page: Page, baseURL: string | undefined, path: string) {
  const problems: string[] = [];
  const origin = new URL(baseURL!).origin;

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const at = msg.location().url;
    if (at && isVercelInternal(at)) return;
    problems.push(`console error: ${msg.text()}${at ? ` (${at})` : ""}`);
  });
  page.on("pageerror", (err) => problems.push(`uncaught exception: ${err.message}`));
  page.on("requestfailed", (req) => {
    if (req.url().startsWith(origin) && !isVercelInternal(req.url())) {
      problems.push(`request failed: ${req.url()} (${req.failure()?.errorText})`);
    }
  });
  page.on("response", (res) => {
    if (res.url().startsWith(origin) && res.status() >= 400 && !isVercelInternal(res.url())) {
      problems.push(`HTTP ${res.status()}: ${res.url()}`);
    }
  });

  // networkidle so client-rendered charts have hydrated and any errors they
  // throw are caught before the assertions run.
  const response = await page.goto(path, { waitUntil: "networkidle" });
  await expect(page.getByText(/Application error|Minified React error/)).toHaveCount(0);
  return { status: response?.status(), problems };
}

for (const path of PAGES) {
  test(`${path} loads cleanly`, async ({ page, baseURL }) => {
    const { status, problems } = await visit(page, baseURL, path);
    expect(status).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    expect(problems).toEqual([]);
  });
}

for (const scenario of scenarios) {
  test(`/fed-chair/${scenario.id} loads cleanly`, async ({ page, baseURL }) => {
    const { status, problems } = await visit(page, baseURL, `/fed-chair/${scenario.id}`);
    expect(status).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: scenario.hookQuestion })).toBeVisible();
    expect(problems).toEqual([]);
  });
}

test("/style-guide is hidden in production", async ({ page }) => {
  const response = await page.goto("/style-guide");
  expect(response?.status()).toBe(404);
});

test("primary nav is visible on desktop", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop layout only");
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link")).toHaveCount(6);
});

test("menu sheet opens on mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile layout only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("navigation", { name: "Primary" }).getByRole("link")).toHaveCount(6);
});

test("metadata images are served", async ({ request, isMobile }) => {
  test.skip(isMobile, "viewport-independent; run once");
  const og = await request.get("/opengraph-image");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toBe("image/png");

  const icon = await request.get("/icon.svg");
  expect(icon.status()).toBe(200);
  expect(icon.headers()["content-type"]).toContain("image/svg+xml");
});
