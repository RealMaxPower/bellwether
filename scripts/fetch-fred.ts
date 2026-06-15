/**
 * Fetch real PMI series from FRED and write to data/fred/*.json. Replaces the
 * synthetic snapshots produced by generate-synthetic-data.mjs.
 *
 *   FRED_API_KEY=... npx tsx scripts/fetch-fred.ts
 *
 * FRED is free; register at https://fred.stlouisfed.org/docs/api/api_key.html.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Auto-load .env.local so `npm run refresh-data` matches what SETUP.md
// promises. Node 20.6+ ships process.loadEnvFile natively; on older
// runtimes we fall through to whatever's already in the environment.
const envFile = resolve(process.cwd(), ".env.local");
if (
  existsSync(envFile) &&
  typeof (process as { loadEnvFile?: (p: string) => void }).loadEnvFile === "function"
) {
  (process as { loadEnvFile: (p: string) => void }).loadEnvFile(envFile);
}

// FRED dropped the ISM PMI series (NAPM and the five subindices) in 2016 when
// ISM tightened redistribution licensing. The project's primary signal is now
// INDPRO — Industrial Production: Total Index — which FRED has carried since
// 1919 and updates monthly. (IPMAN, the manufacturing-only cut, only covers
// 1972→present.) PMI lives on as a secondary hand-curated series; see
// data/fred/NAPM.json's provenance field.
const SERIES = [
  {
    id: "INDPRO",
    title: "Industrial Production: Total Index",
    units: "Index 2017=100",
  },
  {
    id: "IPMAN",
    title: "Industrial Production: Manufacturing",
    units: "Index 2017=100",
  },
  { id: "FEDFUNDS", title: "Effective Federal Funds Rate", units: "Percent" },
] as const;

const apiKey = process.env.FRED_API_KEY;
if (!apiKey) {
  console.error("FRED_API_KEY is required. Add it to .env.local and re-run.");
  process.exit(1);
}

const dataDir = resolve(process.cwd(), "data", "fred");
mkdirSync(dataDir, { recursive: true });

type FredObservation = { date: string; value: string };
type FredResponse = { observations: FredObservation[] };

type FredFetchResult = {
  observations: { date: string; value: number }[];
  vintage: string | undefined;
};

async function fetchSeries(id: string): Promise<FredFetchResult> {
  const url = new URL("https://api.stlouisfed.org/fred/series/observations");
  url.searchParams.set("series_id", id);
  url.searchParams.set("api_key", apiKey!);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("observation_start", "1948-01-01");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FRED ${id}: HTTP ${res.status}`);
  }
  const json = (await res.json()) as FredResponse & { realtime_end?: string };
  const observations = json.observations
    .filter((o) => o.value !== ".")
    .map((o) => ({
      // FRED returns YYYY-MM-DD; normalize to first-of-month
      date: `${o.date.slice(0, 7)}-01`,
      value: Number(o.value),
    }));
  return { observations, vintage: json.realtime_end };
}

const TODAY = new Date().toISOString().slice(0, 10);

async function main() {
  for (const series of SERIES) {
    console.log(`Fetching ${series.id}...`);
    const { observations, vintage } = await fetchSeries(series.id);
    writeFileSync(
      resolve(dataDir, `${series.id}.json`),
      JSON.stringify(
        {
          id: series.id,
          title: series.title,
          source: "FRED (Federal Reserve Bank of St. Louis)",
          units: series.units,
          provenance: "fred",
          lastVerifiedAt: TODAY,
          ...(vintage ? { vintage } : {}),
          observations,
        },
        null,
        2,
      ),
    );
    console.log(`  ${observations.length} observations · vintage ${vintage ?? "n/a"}`);
  }

  // USREC — recession periods are derived from NBER but the FRED USREC binary
  // series isn't ideal for our use. We keep the hand-curated period list.
  console.log("USREC periods are hand-curated in data/fred/USREC.json — leaving alone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
