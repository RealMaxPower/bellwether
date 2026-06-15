import { cache } from "../cache";
import {
  curatedSeriesSchema,
  monthlySeriesSchema,
  recessionsFileSchema,
  servicesSubindexNames,
  servicesSubindexRowsFileSchema,
  subindexNames,
  subindexRowsFileSchema,
  type CuratedObservation,
  type CuratedSeries,
  type MonthlySeries,
  type RecessionsFile,
  type ServicesSubindexName,
  type ServicesSubindexRowsFile,
  type SubindexName,
  type SubindexRowsFile,
} from "./schemas";

import indpro from "../../../data/fred/INDPRO.json";
import ipman from "../../../data/fred/IPMAN.json";
import pmi from "../../../data/fred/NAPM.json";
import newOrders from "../../../data/fred/NAPMNOI.json";
import production from "../../../data/fred/NAPMPI.json";
import employment from "../../../data/fred/NAPMEI.json";
import supplierDeliveries from "../../../data/fred/NAPMSDI.json";
import inventories from "../../../data/fred/NAPMII.json";
import fedFunds from "../../../data/fred/FEDFUNDS.json";
import recessions from "../../../data/fred/USREC.json";
import curatedPmi from "../../../data/pmi-curated.json";
import historicalPmi from "../../../data/pmi-historical.json";
import waybackPmi from "../../../data/pmi-wayback.json";
import waybackSubindices from "../../../data/pmi-subindices-wayback.json";
import curatedNmi from "../../../data/nmi-curated.json";
import waybackNmi from "../../../data/nmi-wayback.json";
import waybackNmiSubindices from "../../../data/nmi-subindices-wayback.json";

/**
 * Validate-and-load helpers. We cache per-series so the Zod parse only happens
 * once per process, not once per import site.
 */
export const getINDPRO = cache((): MonthlySeries => monthlySeriesSchema.parse(indpro));
export const getIPMAN = cache((): MonthlySeries => monthlySeriesSchema.parse(ipman));
export const getPMI = cache((): MonthlySeries => monthlySeriesSchema.parse(pmi));
export const getFedFunds = cache((): MonthlySeries => monthlySeriesSchema.parse(fedFunds));
export const getRecessions = cache((): RecessionsFile => recessionsFileSchema.parse(recessions));
export const getCuratedPMI = cache((): CuratedSeries => curatedSeriesSchema.parse(curatedPmi));
export const getHistoricalPMI = cache((): CuratedSeries =>
  curatedSeriesSchema.parse(historicalPmi),
);
export const getWaybackPMI = cache((): CuratedSeries =>
  curatedSeriesSchema.parse(waybackPmi),
);

/**
 * Merged PMI: stack of three sources, applied in trust order so the most
 * authoritative source wins on overlap.
 *   1. forecasts.org mirror (1948→2014)         — third-party-mirror
 *   2. Wayback archive of ISM releases (2014→)  — wayback-archive (overwrites mirror)
 *   3. Hand-curated rows (sparse, current vintage) — overwrites everything
 * Each observation keeps its own sourceUrl, so the citation chain remains
 * row-level. The file-level provenance label is the weakest of the inputs.
 */
export const getMergedPMI = cache((): CuratedSeries => {
  const historical = getHistoricalPMI();
  const wayback = getWaybackPMI();
  const curated = getCuratedPMI();
  const byDate = new Map<string, CuratedObservation>();
  for (const o of historical.observations) byDate.set(o.date, o);
  for (const o of wayback.observations) byDate.set(o.date, o);
  for (const o of curated.observations) byDate.set(o.date, o);
  const observations = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const lastVerifiedAt = [
    historical.lastVerifiedAt,
    wayback.lastVerifiedAt,
    curated.lastVerifiedAt,
  ].sort()[2]!;
  return {
    id: "PMI-MERGED",
    title: "ISM Manufacturing PMI Composite (merged: mirror + Wayback + curated)",
    source:
      "forecasts.org mirror (1948→2014) + Wayback archive of ISM monthly Reports on Business (2014→) + hand-curated; ISM is primary origin",
    units: "Index",
    provenance: "third-party-mirror",
    lastVerifiedAt,
    observations,
  };
});

/**
 * Year-over-year % change of an index series. Drops the first 12 months
 * (insufficient lookback). Output is a normal MonthlyObservation series whose
 * `value` is a percentage (e.g. 2.3 for +2.3%). Useful for turning a level
 * series like INDPRO into a cyclical signal centered on 0.
 */
export const getINDPROYoY = cache((): MonthlySeries => {
  const base = getINDPRO();
  const observations = [];
  for (let i = 12; i < base.observations.length; i += 1) {
    const now = base.observations[i]!;
    const prior = base.observations[i - 12]!;
    if (prior.value === 0) continue;
    observations.push({
      date: now.date,
      value: ((now.value - prior.value) / prior.value) * 100,
    });
  }
  return {
    id: `${base.id}-YOY`,
    title: `${base.title} (year-over-year % change)`,
    source: base.source,
    units: "Percent",
    provenance: base.provenance,
    lastVerifiedAt: base.lastVerifiedAt,
    vintage: base.vintage,
    observations,
  };
});

const subindexFiles: Record<SubindexName, unknown> = {
  newOrders,
  production,
  employment,
  supplierDeliveries,
  inventories,
};

export const getSubindex = cache((name: SubindexName): MonthlySeries =>
  monthlySeriesSchema.parse(subindexFiles[name]),
);

/**
 * Get all five subindex series in a fixed order. Useful for backtest math.
 *
 * Returns the synthetic FRED placeholders. Most pages should use
 * `getWaybackSubindices()` instead to get the primary-source values.
 */
export const getAllSubindices = cache((): Record<SubindexName, MonthlySeries> => ({
  newOrders: getSubindex("newOrders"),
  production: getSubindex("production"),
  employment: getSubindex("employment"),
  supplierDeliveries: getSubindex("supplierDeliveries"),
  inventories: getSubindex("inventories"),
}));

/**
 * Five MonthlySeries projected out of `data/pmi-subindices-wayback.json` —
 * one per subindex, sourced from the same Wayback ROB pages that supplied
 * the headline composite. Sparse: only months in our Wayback window have
 * values (2014-09 → 2015-03 and 2020-06 → present, with the structural
 * 2015-04 → 2020-05 gap).
 *
 * Provenance is `wayback-archive` (factual values, ISM as primary origin,
 * archived snapshot as the citation channel).
 */
export const getWaybackSubindices = cache(
  (): Record<SubindexName, MonthlySeries> => {
    const file = subindexRowsFileSchema.parse(waybackSubindices) as SubindexRowsFile;
    const result = {} as Record<SubindexName, MonthlySeries>;
    for (const name of subindexNames) {
      result[name] = {
        id: `PMI-${name.toUpperCase()}-WAYBACK`,
        title: `ISM Manufacturing ${labelFor(name)} (Wayback)`,
        source: file.source,
        units: file.units,
        provenance: file.provenance,
        lastVerifiedAt: file.lastVerifiedAt,
        observations: file.observations.map((r) => ({ date: r.date, value: r[name] })),
      };
    }
    return result;
  },
);

/**
 * The headline composite stored alongside the subindices in
 * pmi-subindices-wayback.json. Identical dates to `getWaybackSubindices()`.
 * Useful when you need PMI and subindices to be aligned to the same window
 * exactly (e.g. /decompose's overlay chart).
 */
export const getWaybackSubindexComposite = cache((): MonthlySeries => {
  const file = subindexRowsFileSchema.parse(waybackSubindices) as SubindexRowsFile;
  return {
    id: "PMI-WAYBACK-FROM-SUBINDEX-FILE",
    title: "ISM Manufacturing PMI Composite (subindex-file companion)",
    source: file.source,
    units: file.units,
    provenance: file.provenance,
    lastVerifiedAt: file.lastVerifiedAt,
    observations: file.observations.map((r) => ({ date: r.date, value: r.composite })),
  };
});

function labelFor(name: SubindexName): string {
  switch (name) {
    case "newOrders":
      return "New Orders Index";
    case "production":
      return "Production Index";
    case "employment":
      return "Employment Index";
    case "supplierDeliveries":
      return "Supplier Deliveries Index";
    case "inventories":
      return "Inventories Index";
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Services / NMI accessors.
 *
 * Parallel to the Manufacturing accessors above. Three sources stack the
 * same way: third-party historical mirror (deferred — no equivalent of
 * forecasts.org for Services has been wired yet), Wayback archive of ISM
 * Services ROB pages, and hand-curated rows. Until the scrapers run, the
 * Wayback file ships as synthetic placeholders (`provenance: "synthetic"`).
 * ────────────────────────────────────────────────────────────────────────── */

export const getCuratedNMI = cache((): CuratedSeries =>
  curatedSeriesSchema.parse(curatedNmi),
);

export const getWaybackNMI = cache((): CuratedSeries =>
  curatedSeriesSchema.parse(waybackNmi),
);

/**
 * Merged NMI: Wayback archive overwritten by hand-curated rows. No historical
 * mirror in the stack (the Services PMI series only starts in 1997 anyway,
 * and a clean redistributable 1997→~2014 backfill source is TBD). The
 * file-level provenance is the weakest of the inputs.
 */
export const getMergedNMI = cache((): CuratedSeries => {
  const wayback = getWaybackNMI();
  const curated = getCuratedNMI();
  const byDate = new Map<string, CuratedObservation>();
  for (const o of wayback.observations) byDate.set(o.date, o);
  for (const o of curated.observations) byDate.set(o.date, o);
  const observations = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const lastVerifiedAt =
    [wayback.lastVerifiedAt, curated.lastVerifiedAt].sort()[1] ?? wayback.lastVerifiedAt;
  return {
    id: "NMI-MERGED",
    title: "ISM Services PMI / NMI Composite (merged: Wayback + curated)",
    source:
      "Wayback archive of ISM monthly Services Reports on Business + hand-curated; ISM is primary origin",
    units: "Index",
    provenance: wayback.provenance,
    lastVerifiedAt,
    observations,
  };
});

/**
 * Four ServicesSubindexName MonthlySeries projected out of
 * data/nmi-subindices-wayback.json — one per headline subindex (Business
 * Activity, New Orders, Employment, Supplier Deliveries). Sparse: only
 * months in our Wayback window have values.
 */
export const getWaybackNMISubindices = cache(
  (): Record<ServicesSubindexName, MonthlySeries> => {
    const file = servicesSubindexRowsFileSchema.parse(
      waybackNmiSubindices,
    ) as ServicesSubindexRowsFile;
    const result = {} as Record<ServicesSubindexName, MonthlySeries>;
    for (const name of servicesSubindexNames) {
      result[name] = {
        id: `NMI-${name.toUpperCase()}-WAYBACK`,
        title: `ISM Services ${servicesLabelFor(name)} (Wayback)`,
        source: file.source,
        units: file.units,
        provenance: file.provenance,
        lastVerifiedAt: file.lastVerifiedAt,
        observations: file.observations.map((r) => ({ date: r.date, value: r[name] })),
      };
    }
    return result;
  },
);

/**
 * Headline composite stored alongside the four subindices. Identical dates
 * to `getWaybackNMISubindices()`. Useful when you need the headline and
 * subindices aligned exactly.
 */
export const getWaybackNMISubindexComposite = cache((): MonthlySeries => {
  const file = servicesSubindexRowsFileSchema.parse(
    waybackNmiSubindices,
  ) as ServicesSubindexRowsFile;
  return {
    id: "NMI-WAYBACK-FROM-SUBINDEX-FILE",
    title: "ISM Services PMI Composite (subindex-file companion)",
    source: file.source,
    units: file.units,
    provenance: file.provenance,
    lastVerifiedAt: file.lastVerifiedAt,
    observations: file.observations.map((r) => ({ date: r.date, value: r.composite })),
  };
});

function servicesLabelFor(name: ServicesSubindexName): string {
  switch (name) {
    case "businessActivity":
      return "Business Activity Index";
    case "newOrders":
      return "New Orders Index";
    case "employment":
      return "Employment Index";
    case "supplierDeliveries":
      return "Supplier Deliveries Index";
  }
}
