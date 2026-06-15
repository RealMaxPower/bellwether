import { describe, expect, it } from "vitest";
import {
  getAllSubindices,
  getFedFunds,
  getMergedPMI,
  getPMI,
  getRecessions,
  getWaybackNMI,
  getWaybackNMISubindices,
  getWaybackPMI,
  getWaybackSubindices,
} from "./series";

/**
 * Freshness + provenance checks. Two tiers:
 *   - Always-on: every primary series has a recent latest observation, all
 *     subindices share the same latest month, lastVerifiedAt is recent.
 *   - Strict (STRICT_DATA_CHECKS=1, set in CI): no *user-facing* series may
 *     carry provenance: "synthetic". The vestigial FRED NAPM stubs are
 *     exempt because FRED removed those IDs in June 2016 at ISM's request —
 *     the app reads the Wayback-scraped files instead, so the stubs are
 *     inert. See /about-the-data for the per-series breakdown.
 */

const STRICT = process.env.STRICT_DATA_CHECKS === "1";
const MAX_AGE_DAYS = 75;

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

describe("data freshness — Manufacturing", () => {
  it(`merged PMI's latest observation is younger than ${MAX_AGE_DAYS} days`, () => {
    // The homepage and worked-example render getMergedPMI(), which folds in
    // the Wayback archive and the hand-curated CSV. The bare getPMI() reads
    // the inert FRED NAPM stub (synthetic since 2016) and would mask staleness.
    const pmi = getMergedPMI();
    const last = pmi.observations.at(-1);
    expect(last).toBeDefined();
    expect(daysSince(last!.date)).toBeLessThan(MAX_AGE_DAYS);
  });

  it("all five Wayback subindices end on the same month as Wayback PMI", () => {
    // /decompose renders the Wayback subindex composite alongside the Wayback
    // headline, so the invariant is internal consistency within the Wayback
    // bundle (not freshness vs the merged series, which can run ahead via
    // PRNewswire-imported headline-only rows). The FRED subindex stubs
    // (getAllSubindices) are inert in this build.
    const pmiLast = getWaybackPMI().observations.at(-1)!.date;
    const subs = getWaybackSubindices();
    for (const [name, series] of Object.entries(subs)) {
      const subLast = series.observations.at(-1)!.date;
      expect(subLast, `Wayback subindex ${name} latest date`).toBe(pmiLast);
    }
  });

  it("FEDFUNDS ends within one month of merged PMI's latest observation", () => {
    const pmiLast = new Date(getMergedPMI().observations.at(-1)!.date).getTime();
    const ffLast = new Date(getFedFunds().observations.at(-1)!.date).getTime();
    const diffDays = Math.abs(pmiLast - ffLast) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeLessThanOrEqual(35);
  });

  it("every series's lastVerifiedAt is within MAX_AGE_DAYS", () => {
    const series = [
      ["NAPM", getPMI()],
      ["FEDFUNDS", getFedFunds()],
      ...Object.entries(getAllSubindices()),
    ] as const;
    for (const [name, s] of series) {
      expect(daysSince(s.lastVerifiedAt), `${name} lastVerifiedAt`).toBeLessThan(MAX_AGE_DAYS);
    }
    expect(daysSince(getRecessions().lastVerifiedAt), "USREC lastVerifiedAt").toBeLessThan(
      365 * 2,
    );
  });

  it("recession periods all carry an NBER sourceUrl", () => {
    for (const period of getRecessions().periods) {
      expect(period.sourceUrl, `${period.peak} period sourceUrl`).toMatch(/^https?:\/\//);
    }
  });

  it("Wayback Manufacturing PMI is real (not synthetic)", () => {
    expect(getWaybackPMI().provenance).not.toBe("synthetic");
    const subs = getWaybackSubindices();
    for (const [name, s] of Object.entries(subs)) {
      expect(s.provenance, `Wayback ${name} provenance`).not.toBe("synthetic");
    }
  });
});

const NMI_MAX_AGE_DAYS = 365;

describe("data freshness — Services / NMI", () => {
  it(`Wayback NMI's latest observation is younger than ${NMI_MAX_AGE_DAYS} days`, () => {
    // Services has no parallel of the Mfg curated-CSV flow, so realistic
    // freshness is constrained by the Wayback Machine's capture cadence
    // for ISM Services ROB pages — typically lags 6-9 months behind live.
    // A year is the meaningful upper bound; failures here mean either the
    // scraper hasn't been re-run in too long or Wayback isn't archiving
    // the page anymore.
    const nmi = getWaybackNMI();
    const last = nmi.observations.at(-1);
    expect(last).toBeDefined();
    expect(daysSince(last!.date)).toBeLessThan(NMI_MAX_AGE_DAYS);
  });

  it("all four headline subindices end on the same month as NMI headline", () => {
    const nmiLast = getWaybackNMI().observations.at(-1)!.date;
    const subs = getWaybackNMISubindices();
    for (const [name, series] of Object.entries(subs)) {
      const subLast = series.observations.at(-1)!.date;
      expect(subLast, `NMI subindex ${name} latest date`).toBe(nmiLast);
    }
  });

  it("Wayback NMI is real (not synthetic) — STRICT-tier signal in always-on", () => {
    // Promoted from STRICT-only: NMI synthetic placeholders are always a bug
    // because the scraper exists and produces real values. If this test
    // fails, run `npm run import-wayback-nmi` and
    // `npm run import-wayback-nmi-subindices`.
    expect(
      getWaybackNMI().provenance,
      "data/nmi-wayback.json provenance — run `npm run import-wayback-nmi`",
    ).not.toBe("synthetic");
    const subs = getWaybackNMISubindices();
    for (const [name, s] of Object.entries(subs)) {
      expect(
        s.provenance,
        `data/nmi-subindices-wayback.json ${name} provenance — run \`npm run import-wayback-nmi-subindices\``,
      ).not.toBe("synthetic");
    }
  });

  it("every NMI series's lastVerifiedAt is within 365 days", () => {
    expect(daysSince(getWaybackNMI().lastVerifiedAt), "NMI Wayback lastVerifiedAt").toBeLessThan(
      365,
    );
    for (const [name, s] of Object.entries(getWaybackNMISubindices())) {
      expect(
        daysSince(s.lastVerifiedAt),
        `NMI subindex ${name} lastVerifiedAt`,
      ).toBeLessThan(365);
    }
  });
});

describe.skipIf(!STRICT)("STRICT — no user-facing synthetic provenance", () => {
  it("FRED-backed series with active sources are real (FEDFUNDS only — INDPRO, IPMAN handled by Wayback in this build)", () => {
    expect(getFedFunds().provenance, "FEDFUNDS provenance").not.toBe("synthetic");
  });

  it("USREC is real", () => {
    expect(getRecessions().provenance, "USREC provenance").not.toBe("synthetic");
  });

  // Note: NAPM and the 5 NAPMxxx FRED stubs ARE synthetic by design (FRED
  // removed them June 2016). They're inert — the app reads
  // data/pmi-wayback.json + data/pmi-subindices-wayback.json instead. The
  // Wayback-files-are-real test in the always-on suite above is what
  // guarantees the user-facing PMI values are non-synthetic.
});
