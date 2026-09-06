import { describe, expect, it } from "vitest";
import {
  getFedFunds,
  getMergedNMI,
  getMergedPMI,
  getRecessions,
  getWaybackNMI,
  getWaybackNMISubindices,
  getWaybackPMI,
  getWaybackSubindices,
} from "./series";
import industryMonthlyRaw from "../../../data/industry-monthly-wayback.json";
import servicesIndustryMonthlyRaw from "../../../data/services-industry-monthly-wayback.json";

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

  it("every refreshed series's lastVerifiedAt is within MAX_AGE_DAYS", () => {
    // Only series that something in the refresh pipeline actually rewrites
    // belong here. The FRED NAPM stub and the five NAPMxxx subindex stubs are
    // deliberately excluded: scripts/fetch-fred.ts fetches INDPRO, IPMAN and
    // FEDFUNDS only — FRED dropped the ISM IDs in 2016 — so nothing ever
    // touches their lastVerifiedAt. Asserting on them made this test fail by
    // construction 75 days after the last hand-edit, which is what it did.
    // Their inertness is covered by the STRICT provenance block below.
    const series = [
      ["FEDFUNDS", getFedFunds()],
      ["Wayback PMI", getWaybackPMI()],
      ...Object.entries(getWaybackSubindices()),
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
  it(`merged NMI's latest observation is younger than ${MAX_AGE_DAYS} days`, () => {
    // The homepage and /pmi-explained render getMergedNMI(), the Services
    // mirror of getMergedPMI() — Wayback overwritten by hand-curated rows,
    // which scripts/import-prnewswire-ism.ts keeps current. This is the
    // user-facing freshness gate for Services; the Wayback-only check below
    // is a separate signal about the archive channel itself.
    const nmi = getMergedNMI();
    const last = nmi.observations.at(-1);
    expect(last).toBeDefined();
    expect(daysSince(last!.date)).toBeLessThan(MAX_AGE_DAYS);
  });

  it(`Wayback NMI's latest observation is younger than ${NMI_MAX_AGE_DAYS} days`, () => {
    // Wayback captures of the ISM Services ROB pages lag live by 6-9 months,
    // so a year is the meaningful upper bound. Failures here mean either the
    // scraper hasn't been re-run in too long or Wayback isn't archiving the
    // page anymore — check lastVerifiedAt to tell those apart: recent
    // lastVerifiedAt + old observation means the scraper ran and found
    // nothing, i.e. the archive channel itself has gone quiet.
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

/**
 * The per-industry Wayback files behind /heatmap. Until 2026-09 nothing
 * asserted on them at all, and they rotted twice over without a single test
 * going red: once when ISM's URL rename froze both files at 2025-07, and
 * once when ISM reworded its contraction sentence and the Services file
 * stopped parsing contraction entirely from 2022-03 on.
 *
 * The second failure is the dangerous one. loadSectors() scores each cell by
 * growth *share* — g/(g+c) — so an empty contraction list does not blank the
 * panel, it pins every cell toward +100. A reader sees a confident number
 * with no way to tell it apart from a real boom. Freshness alone would not
 * have caught it: the file was current, its rows were simply half-parsed.
 */
const INDUSTRY_MAX_AGE_DAYS = 365;

describe("industry-level Wayback files behind /heatmap", () => {
  const files = [
    ["Manufacturing", industryMonthlyRaw],
    ["Services", servicesIndustryMonthlyRaw],
  ] as const;

  it.each(files)(
    `%s industry file's latest observation is younger than ${INDUSTRY_MAX_AGE_DAYS} days`,
    (_name, file) => {
      const last = file.observations.at(-1);
      expect(last).toBeDefined();
      expect(daysSince(last!.date)).toBeLessThan(INDUSTRY_MAX_AGE_DAYS);
    },
  );

  it.each(files)(
    "%s industry file records contraction somewhere in its most recent 12 months",
    (_name, file) => {
      // Not "every month has a contracting industry" — a strong month can
      // genuinely have none. But a year with zero contraction anywhere across
      // 18 industries is a parser regression, not an economy. Both real
      // regressions produced exactly this signature.
      const recent = file.observations.slice(-12);
      const withContraction = recent.filter((o) => o.contracting.length > 0);
      expect(
        withContraction.length,
        `no contracting industries in any of the last ${recent.length} months — ` +
          `check extractOverallLists() in scripts/import-wayback-*industries.ts ` +
          `against a current ISM page`,
      ).toBeGreaterThan(0);
    },
  );

  it.each(files)("%s industry file never lists one industry as both", (_name, file) => {
    // An industry cannot grow and contract in the same month. When this
    // fired it meant a contraction pattern had matched a *subindex*
    // sentence and appended its industries on top of the real overall list,
    // which also inflated the row past the 18 that exist.
    for (const o of file.observations) {
      const both = o.growing.filter((i) => o.contracting.includes(i));
      expect(both, `${o.date} lists ${both.join(", ")} as both growing and contracting`).toEqual(
        [],
      );
      expect(
        o.growing.length + o.contracting.length,
        `${o.date} classifies more industries than exist`,
      ).toBeLessThanOrEqual(file.industries.length);
    }
  });

  it.each(files)("%s industry file classifies every month it holds", (_name, file) => {
    // A row with neither list is a silent fetch/parse failure that still
    // counted toward "we have data for that month".
    for (const o of file.observations) {
      expect(
        o.growing.length + o.contracting.length,
        `${o.date} has empty growing AND contracting lists`,
      ).toBeGreaterThan(0);
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
