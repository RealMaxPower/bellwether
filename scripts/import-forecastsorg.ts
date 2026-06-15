/**
 * Import the long historical NAPM/ISM PMI Composite series from
 * forecasts.org's mirror page. Outputs data/pmi-historical.json with
 * provenance "third-party-mirror".
 *
 * Why this source:
 *   FRED removed the NAPM series in 2016 when ISM tightened licensing.
 *   FRED-MD and ALFRED dropped the same variables. The Internet Archive
 *   (which would let us scrape ISM news releases directly) is offline
 *   sitewide as of writing. The Financial Forecast Center page at
 *   https://www.forecasts.org/data/data/NAPM.htm embeds the full monthly
 *   series 1948-01 → 2014-08 as a JS array — frozen since ISM's licensing
 *   change but covering the bulk of the historical record.
 *
 * Legal posture:
 *   The numerical values themselves are facts (Feist Publications v.
 *   Rural Telephone Service, 499 U.S. 340 (1991)), not protected by
 *   copyright. Bellwether reproduces them with attribution to ISM as
 *   the primary origin and to forecasts.org as the proximate source.
 *   No subindex or industry-level data is imported — those remain gated
 *   on ISM redistribution licensing per data/LICENSING.md.
 *
 * Workflow:
 *   1. `npx tsx scripts/import-forecastsorg.ts`  (or `npm run import-historical`)
 *   2. The script fetches the page live, regex-extracts the JS array,
 *      validates monotonic dates and a value range of [0, 100], spot-checks
 *      the overlapping months against data/pmi-curated.json (must be
 *      within ±0.5 — typical ISM seasonal-adjustment vintage drift),
 *      and writes data/pmi-historical.json.
 *   3. Schema validation runs on the next page render
 *      (curatedSeriesSchema with provenance "third-party-mirror").
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SOURCE_URL = "https://www.forecasts.org/data/data/NAPM.htm";
const SPOT_CHECK_TOLERANCE = 0.5;

const root = process.cwd();
const outPath = resolve(root, "data", "pmi-historical.json");
const curatedPath = resolve(root, "data", "pmi-curated.json");

async function main() {
  console.log(`Fetching ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "BellwetherEduFetch/1.0 (educational, non-commercial)" },
  });
  if (!res.ok) {
    console.error(`fetch failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const html = await res.text();

  // Page embeds the data as Google-Charts arrayToDataTable rows:
  //   ['1948-01-01', 51.7],
  //   ['1948-02-01', 50.2],
  //   ...
  const rowRe = /\['(\d{4}-\d{2}-\d{2})',\s*([0-9.]+)\]/g;
  const rows: { date: string; value: number }[] = [];
  for (const m of html.matchAll(rowRe)) {
    const [, date, valueStr] = m;
    const value = Number(valueStr);
    if (!Number.isFinite(value)) continue;
    if (value < 0 || value > 100) {
      console.error(`out-of-range value at ${date}: ${value}`);
      process.exit(1);
    }
    rows.push({ date: date!, value });
  }

  if (rows.length < 700) {
    console.error(
      `expected at least 700 observations from forecasts.org, got ${rows.length}. ` +
        `Page format may have changed — inspect ${SOURCE_URL} manually.`,
    );
    process.exit(1);
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));

  // Reject duplicates and non-month-start dates.
  const seen = new Set<string>();
  for (const r of rows) {
    if (!/^\d{4}-\d{2}-01$/.test(r.date)) {
      console.error(`non-month-start date: ${r.date}`);
      process.exit(1);
    }
    if (seen.has(r.date)) {
      console.error(`duplicate date: ${r.date}`);
      process.exit(1);
    }
    seen.add(r.date);
  }

  // Spot-check against the hand-curated file. Hand-curated values come from
  // current ISM news releases, so vintage drift of <= 0.5 is acceptable;
  // anything bigger means either FFC has a different series or our hand
  // values are wrong, and either way we want the maintainer to look.
  let spotChecks = 0;
  if (existsSync(curatedPath)) {
    const curated = JSON.parse(readFileSync(curatedPath, "utf8")) as {
      observations: { date: string; value: number }[];
    };
    const ffcByDate = new Map(rows.map((r) => [r.date, r.value]));
    const drifts: { date: string; ffc: number; hand: number; delta: number }[] = [];
    for (const obs of curated.observations) {
      const ffc = ffcByDate.get(obs.date);
      if (ffc === undefined) continue;
      const delta = Math.abs(ffc - obs.value);
      drifts.push({ date: obs.date, ffc, hand: obs.value, delta });
      spotChecks += 1;
    }
    const failed = drifts.filter((d) => d.delta > SPOT_CHECK_TOLERANCE);
    if (failed.length > 0) {
      console.error(`Spot-check failed (tolerance ±${SPOT_CHECK_TOLERANCE}):`);
      for (const f of failed) {
        console.error(`  ${f.date}: FFC=${f.ffc} hand=${f.hand} Δ=${f.delta.toFixed(2)}`);
      }
      process.exit(1);
    }
    if (drifts.length > 0) {
      console.log(`Spot-check ${drifts.length} overlap(s) — all within ±${SPOT_CHECK_TOLERANCE}:`);
      for (const d of drifts) {
        console.log(
          `  ${d.date}: FFC=${d.ffc} hand=${d.hand} Δ=${d.delta.toFixed(2)}`,
        );
      }
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const out = {
    id: "PMI-HISTORICAL",
    title: "ISM Manufacturing PMI Composite (historical mirror, 1948→)",
    source:
      "Financial Forecast Center mirror of NAPM/ISM Manufacturing PMI Composite — values originate with ISM (formerly NAPM)",
    units: "Index",
    provenance: "third-party-mirror",
    lastVerifiedAt: today,
    observations: rows.map((r) => ({ ...r, sourceUrl: SOURCE_URL })),
  };

  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);

  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  console.log(
    `\nWrote ${rows.length} observation(s) to data/pmi-historical.json\n` +
      `  range:        ${first.date} → ${last.date}\n` +
      `  spot-checks:  ${spotChecks} (against data/pmi-curated.json)\n` +
      `  verified:     ${today}\n` +
      `  source:       ${SOURCE_URL}\n`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
