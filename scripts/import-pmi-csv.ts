/**
 * Convert a hand-edited CSV of ISM PMI values into data/pmi-curated.json.
 *
 * Workflow:
 *   1. Maintainer reads ISM monthly Reports on Business at
 *      https://www.ismworld.org/supply-management-news-and-reports/news-publications/news-feed/
 *   2. For each month they want to record, append a row to data/pmi-curated.csv
 *      in the form:  YYYY-MM-01,<value>,<release URL>
 *      e.g.          2026-04-01,49.1,https://www.ismworld.org/.../april-2026/
 *      Lines starting with # and blank lines are ignored.
 *   3. Run:           npx tsx scripts/import-pmi-csv.ts
 *      (or `npm run import-pmi`)
 *   4. The script validates each row, sorts by date, and writes
 *      data/pmi-curated.json with an updated lastVerifiedAt.
 *
 * Schema enforcement happens on the *next* page render — the loader runs the
 * curatedSeriesSchema parse, so any malformed entry fails the build loud.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const csvPath = resolve(root, "data", "pmi-curated.csv");
const jsonPath = resolve(root, "data", "pmi-curated.json");

if (!existsSync(csvPath)) {
  console.error(
    `data/pmi-curated.csv not found. Create it first with one row per month:\n` +
      `  YYYY-MM-01,<headline PMI>,<ISM news release URL>\n`,
  );
  process.exit(1);
}

const lines = readFileSync(csvPath, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0 && !l.startsWith("#"));

type Row = { date: string; value: number; sourceUrl: string };
const rows: Row[] = [];
const errors: string[] = [];

for (const [i, line] of lines.entries()) {
  const parts = line.split(",").map((p) => p.trim());
  if (parts.length < 3) {
    errors.push(`row ${i + 1}: expected 3 columns, got ${parts.length} → "${line}"`);
    continue;
  }
  const [date, valueStr, sourceUrl] = parts as [string, string, string];
  if (!/^\d{4}-\d{2}-01$/.test(date)) {
    errors.push(`row ${i + 1}: date must be YYYY-MM-01, got "${date}"`);
    continue;
  }
  const value = Number(valueStr);
  if (!Number.isFinite(value)) {
    errors.push(`row ${i + 1}: value must be a number, got "${valueStr}"`);
    continue;
  }
  if (!/^https?:\/\//.test(sourceUrl)) {
    errors.push(`row ${i + 1}: sourceUrl must be http(s), got "${sourceUrl}"`);
    continue;
  }
  rows.push({ date, value, sourceUrl });
}

if (errors.length > 0) {
  console.error(`Found ${errors.length} error(s) in data/pmi-curated.csv:`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

rows.sort((a, b) => a.date.localeCompare(b.date));

// Reject duplicate months — the maintainer should fix the CSV manually.
const seen = new Set<string>();
for (const row of rows) {
  if (seen.has(row.date)) {
    console.error(`Duplicate row for ${row.date} in CSV. Fix the CSV before re-running.`);
    process.exit(1);
  }
  seen.add(row.date);
}

const today = new Date().toISOString().slice(0, 10);
const out = {
  id: "PMI-CURATED",
  title: "ISM Manufacturing PMI Composite (hand-curated)",
  source: "ISM monthly Report on Business news releases",
  units: "Index",
  provenance: "hand-curated",
  lastVerifiedAt: today,
  observations: rows,
};

writeFileSync(jsonPath, `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote ${rows.length} observation(s) to data/pmi-curated.json (verified ${today}).`);
