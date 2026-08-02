/**
 * Reconcile the PMI values this repo publishes against independent evidence.
 * Two checks, both against real data:
 *
 *   1. Cross-source — every month carried by BOTH the Wayback archive and the
 *      hand-curated/PRNewswire series must agree. Fully automatic: it needs no
 *      upkeep and widens by itself as PRNewswire coverage grows. These are
 *      genuinely independent channels (an archived ISM page vs. an ISM press
 *      release), so agreement is evidence rather than a tautology.
 *
 *   2. Spot-checks — data/ism-spot-checks.json, headline values read by hand
 *      out of the ISM release prose. This is the only available check for the
 *      months carried by a single source, which is most of the series.
 *
 * Previously this compared spot-checks against data/fred/NAPM.json, which is
 * `provenance: "synthetic"` — FRED dropped the ISM series in 2016 and the stub
 * is inert. Against the 0.5 tolerance every recent month diverged by 1.2-4.1,
 * so seeding any real value would have failed by construction; and the two
 * newest months were absent from the stub entirely, so they were silently
 * skipped as "outside FRED data range" — no coverage exactly where it matters
 * most. Reconciling against fabricated data is worse than not reconciling,
 * because it looks like a passing check.
 *
 * Run as part of `npm run check-data`. Exits non-zero on any divergence.
 *
 *   npx tsx scripts/reconcile-ism.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type SpotCheck = {
  date: string;
  headlinePmi: number;
  sourceUrl: string;
  addedAt: string;
  note?: string;
};

type SpotChecksFile = {
  tolerance: number;
  entries: SpotCheck[];
};

type SeriesObservation = { date: string; value: number; sourceUrl?: string };
type SeriesFile = { id: string; observations: SeriesObservation[] };

const root = process.cwd();

function readSeries(...segments: string[]): SeriesFile {
  return JSON.parse(readFileSync(resolve(root, ...segments), "utf8")) as SeriesFile;
}

const spotChecks = JSON.parse(
  readFileSync(resolve(root, "data", "ism-spot-checks.json"), "utf8"),
) as SpotChecksFile;

const historical = readSeries("data", "pmi-historical.json");
const wayback = readSeries("data", "pmi-wayback.json");
const curated = readSeries("data", "pmi-curated.json");

const { tolerance } = spotChecks;
let failures = 0;

// ---------------------------------------------------------------------------
// 1. Cross-source: Wayback archive vs hand-curated / PRNewswire
// ---------------------------------------------------------------------------

const curatedByDate = new Map(curated.observations.map((o) => [o.date, o.value]));
const overlap = wayback.observations.filter((o) => curatedByDate.has(o.date));

console.log(`Cross-source — ${overlap.length} month(s) carried by both Wayback and curated:`);

for (const o of overlap) {
  const other = curatedByDate.get(o.date)!;
  const diff = Math.abs(other - o.value);
  if (diff <= tolerance) {
    console.log(`OK    ${o.date}  wayback=${o.value}  curated=${other}  Δ=${diff.toFixed(2)}`);
  } else {
    console.error(
      `FAIL  ${o.date}  wayback=${o.value}  curated=${other}  Δ=${diff.toFixed(2)} > ${tolerance}`,
    );
    console.error(`      wayback source: ${o.sourceUrl ?? "(none)"}`);
    failures += 1;
  }
}

if (overlap.length === 0) {
  console.warn(
    "WARN  no overlapping months — the curated series carries nothing the Wayback archive also has, so this check proved nothing.",
  );
}

// ---------------------------------------------------------------------------
// 2. Spot-checks against the merged series the site actually publishes
// ---------------------------------------------------------------------------

// Same precedence as getMergedPMI() in src/lib/data/series.ts: the historical
// mirror is the floor, Wayback overrides it, hand-curated overrides both.
const mergedByDate = new Map<string, number>();
for (const o of historical.observations) mergedByDate.set(o.date, o.value);
for (const o of wayback.observations) mergedByDate.set(o.date, o.value);
for (const o of curated.observations) mergedByDate.set(o.date, o.value);

console.log(`\nSpot-checks — ${spotChecks.entries.length} hand-verified month(s):`);

for (const check of spotChecks.entries) {
  const ours = mergedByDate.get(check.date);
  if (ours === undefined) {
    // A spot-check exists only because someone read that month's release, so
    // the month should be in our data. Its absence is a gap, not a skip.
    console.error(
      `FAIL  ${check.date}  ISM=${check.headlinePmi}  ours=<missing>  → hand-verified month absent from the merged series`,
    );
    console.error(`      ISM source: ${check.sourceUrl}`);
    failures += 1;
    continue;
  }
  const diff = Math.abs(ours - check.headlinePmi);
  if (diff <= tolerance) {
    console.log(`OK    ${check.date}  ISM=${check.headlinePmi}  ours=${ours}  Δ=${diff.toFixed(2)}`);
  } else {
    console.error(
      `FAIL  ${check.date}  ISM=${check.headlinePmi}  ours=${ours}  Δ=${diff.toFixed(2)} > ${tolerance}`,
    );
    console.error(`      ISM source: ${check.sourceUrl}`);
    failures += 1;
  }
}

if (spotChecks.entries.length === 0) {
  console.warn(
    "WARN  no spot-checks seeded — single-source months (most of the series) are unverified.",
  );
}

if (failures > 0) {
  console.error(
    `\n${failures} reconciliation(s) failed. Check the divergence against the cited source, then correct whichever is wrong — the data file or the spot-check entry.`,
  );
  process.exit(1);
}

console.log(
  `\nAll reconciliations passed (${overlap.length} cross-source, ${spotChecks.entries.length} spot-check).`,
);
