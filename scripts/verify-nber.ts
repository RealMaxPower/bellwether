/**
 * Verify the NBER citation chain in data/fred/USREC.json:
 *  1. every period has a sourceUrl pointing at NBER (nber.org)
 *  2. each sourceUrl returns a non-error response (HEAD request)
 *
 * We deliberately do NOT try to re-derive recession dates from NBER's HTML —
 * that's brittle and unnecessary. The point is to keep the citation chain
 * intact: if NBER moves a URL, we want to know.
 *
 *   npx tsx scripts/verify-nber.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Period = { peak: string; trough: string; label?: string; sourceUrl: string };
type UsRec = { periods: Period[] };

const usrec = JSON.parse(
  readFileSync(resolve(process.cwd(), "data", "fred", "USREC.json"), "utf8"),
) as UsRec;

let failures = 0;

for (const period of usrec.periods) {
  if (!period.sourceUrl) {
    console.error(`FAIL  ${period.peak}–${period.trough}  missing sourceUrl`);
    failures += 1;
    continue;
  }
  if (!/^https?:\/\/(www\.)?nber\.org\b/.test(period.sourceUrl)) {
    console.error(
      `FAIL  ${period.peak}–${period.trough}  sourceUrl is not on nber.org: ${period.sourceUrl}`,
    );
    failures += 1;
    continue;
  }
  try {
    // HEAD first; some NBER pages reject HEAD, fall back to GET in that case.
    let res = await fetch(period.sourceUrl, { method: "HEAD" });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(period.sourceUrl, { method: "GET" });
    }
    if (!res.ok) {
      console.error(
        `FAIL  ${period.peak}–${period.trough}  HTTP ${res.status} on ${period.sourceUrl}`,
      );
      failures += 1;
    } else {
      console.log(`OK    ${period.peak}–${period.trough}  ${res.status}  ${period.sourceUrl}`);
    }
  } catch (err) {
    console.error(
      `FAIL  ${period.peak}–${period.trough}  fetch error: ${(err as Error).message}`,
    );
    failures += 1;
  }
}

if (failures > 0) {
  console.error(`\n${failures} NBER citation(s) failed verification.`);
  process.exit(1);
}

console.log(`\nAll ${usrec.periods.length} NBER citations verified.`);
