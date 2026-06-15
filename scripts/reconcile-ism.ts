/**
 * Reconcile FRED's NAPM (PMI Composite) values against the ISM news-release
 * spot-checks the maintainer captures by hand each month. FRED mirrors ISM
 * but lags occasionally and rounds to one decimal — this catches divergence.
 *
 * Run as part of `npm run check-data`. Exits non-zero if any spot-check
 * exceeds the tolerance, so CI flags the divergence for human review.
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

type SeriesObservation = { date: string; value: number };
type SeriesFile = { id: string; observations: SeriesObservation[] };

const root = process.cwd();
const spotChecks = JSON.parse(
  readFileSync(resolve(root, "data", "ism-spot-checks.json"), "utf8"),
) as SpotChecksFile;
const napm = JSON.parse(
  readFileSync(resolve(root, "data", "fred", "NAPM.json"), "utf8"),
) as SeriesFile;

const napmByDate = new Map(napm.observations.map((o) => [o.date, o.value]));

let failures = 0;
let warnings = 0;
for (const check of spotChecks.entries) {
  const fredValue = napmByDate.get(check.date);
  if (fredValue === undefined) {
    console.warn(
      `WARN  ${check.date}  ISM=${check.headlinePmi}  FRED=<missing>  → spot-check dated outside FRED data range, skipping`,
    );
    warnings += 1;
    continue;
  }
  const diff = Math.abs(fredValue - check.headlinePmi);
  if (diff <= spotChecks.tolerance) {
    console.log(
      `OK    ${check.date}  ISM=${check.headlinePmi}  FRED=${fredValue}  Δ=${diff.toFixed(2)}`,
    );
  } else {
    console.error(
      `FAIL  ${check.date}  ISM=${check.headlinePmi}  FRED=${fredValue}  Δ=${diff.toFixed(2)} > tolerance ${spotChecks.tolerance}`,
    );
    console.error(`      ISM source: ${check.sourceUrl}`);
    failures += 1;
  }
}

if (failures > 0) {
  console.error(
    `\n${failures} spot-check(s) failed. Review the divergence above against the ISM source URL, then either correct data/ism-spot-checks.json (if mistyped) or re-run npm run refresh-data (if FRED has caught up).`,
  );
  process.exit(1);
}

console.log(
  `\n${spotChecks.entries.length - warnings} spot-check(s) passed${warnings ? ` (${warnings} skipped)` : ""}.`,
);
