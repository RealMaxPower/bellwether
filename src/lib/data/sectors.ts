import { z } from "zod";
import sectorsRaw from "../../../data/sectors.json";
import sectorsServicesRaw from "../../../data/sectors-services.json";
import industryMonthlyRaw from "../../../data/industry-monthly-wayback.json";
import servicesIndustryMonthlyRaw from "../../../data/services-industry-monthly-wayback.json";
import { industryMonthlyFileSchema, type IndustryMonthlyFile } from "./schemas";

export const regimeSchema = z.object({
  id: z.string(),
  label: z.string(),
  range: z.string(),
});

export const sectorProvenanceSchema = z.enum([
  "hand-estimate",
  "ism-licensed",
  "third-party",
  "wayback-archive",
]);
export type SectorProvenance = z.infer<typeof sectorProvenanceSchema>;

export const sectorProvenanceLabels: Record<SectorProvenance, string> = {
  "hand-estimate": "Hand estimate",
  "ism-licensed": "ISM (licensed)",
  "third-party": "Third-party research",
  "wayback-archive": "Wayback / ISM monthly reports",
};

export const sectorCellSchema = z.object({
  industry: z.string(),
  regime: z.string(),
  score: z.number().int().gte(-100).lte(100),
  narrative: z.string(),
  provenance: sectorProvenanceSchema,
  sourceUrl: z.string().url().optional(),
});

export const sectorsFileSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  lastVerifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  regimes: z.array(regimeSchema).min(2),
  industries: z.array(z.string()).length(18),
  cells: z.array(sectorCellSchema).min(1),
});

export type Regime = z.infer<typeof regimeSchema>;
export type SectorCell = z.infer<typeof sectorCellSchema>;
export type SectorsFile = z.infer<typeof sectorsFileSchema>;

/**
 * The Pandemic & Reshoring regime starts when COVID hits manufacturing
 * (December 2019, per the regime metadata in sectors.json). Industry-level
 * Wayback rows on or after this date are used to compute per-industry
 * growth-frequency scores for the 18 cells in that regime.
 */
const PANDEMIC_REGIME_START = "2019-12-01";

interface PandemicScore {
  industry: string;
  /** Months in this regime that listed the industry as growing. */
  growMonths: number;
  /** Months that listed it as contracting. */
  contractMonths: number;
  /** Earliest sourceUrl that contributed; used as the cell's citation link. */
  representativeSourceUrl: string;
  windowFirst: string;
  windowLast: string;
  /** Total months in the regime where the industry was classified either way. */
  classifiedMonths: number;
  /**
   * Mapped to the signed -100..+100 scale used elsewhere in the heatmap:
   *   100% growing → +100, 50% (mixed) → 0, 0% growing → -100.
   * Concretely: round(growShare × 200 - 100).
   */
  score: number;
}

/**
 * Compute one growth-frequency score per industry for the Pandemic regime,
 * from the per-month industry-level Wayback data. Returns a Map keyed by
 * the canonical industry name. Only includes industries that were
 * classified at least 6 times in the regime — anything thinner than that
 * is too noisy to override the editorial estimate.
 */
function computePandemicIndustryScores(): Map<string, PandemicScore> {
  const file = industryMonthlyFileSchema.parse(
    industryMonthlyRaw,
  ) as IndustryMonthlyFile;
  const inRegime = file.observations.filter(
    (o) => o.date >= PANDEMIC_REGIME_START,
  );
  const scores = new Map<string, PandemicScore>();
  if (inRegime.length === 0) return scores;
  const windowFirst = inRegime[0]!.date;
  const windowLast = inRegime[inRegime.length - 1]!.date;
  const representativeSourceUrl = inRegime[0]!.sourceUrl;

  for (const industry of file.industries) {
    let g = 0;
    let c = 0;
    for (const obs of inRegime) {
      if (obs.growing.includes(industry)) g += 1;
      else if (obs.contracting.includes(industry)) c += 1;
    }
    const classified = g + c;
    if (classified < 6) continue;
    const growShare = g / classified;
    scores.set(industry, {
      industry,
      growMonths: g,
      contractMonths: c,
      classifiedMonths: classified,
      score: Math.round(growShare * 200 - 100),
      windowFirst,
      windowLast,
      representativeSourceUrl,
    });
  }
  return scores;
}

function fmtMonth(iso: string): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [y, m] = iso.split("-");
  return `${months[Number(m) - 1] ?? m} ${y}`;
}

/**
 * Parse the static sectors file, then overlay Wayback-derived scores onto
 * the 18 Pandemic-regime cells where we have at least 6 classified months
 * for the industry. Other regimes (Bretton Woods, Stagflation, Great
 * Moderation, Crisis & Recovery) keep their editorial estimates because no
 * comparable primary-source data is available for those eras.
 */
export function loadSectors(): SectorsFile {
  const base = sectorsFileSchema.parse(sectorsRaw);
  const wayback = computePandemicIndustryScores();
  if (wayback.size === 0) return base;

  const cells = base.cells.map((c) => {
    if (c.regime !== "pandemic-reshoring") return c;
    const ws = wayback.get(c.industry);
    if (!ws) return c; // industry didn't get enough classifications
    return {
      ...c,
      score: ws.score,
      provenance: "wayback-archive" as const,
      narrative: `Reported growth in ${ws.growMonths} of ${ws.classifiedMonths} classified months between ${fmtMonth(ws.windowFirst)} and ${fmtMonth(ws.windowLast)} (per ISM monthly Reports on Business archived on Wayback). Score maps growth-share to the signed −100…+100 scale: 50% growing = 0.`,
      sourceUrl: ws.representativeSourceUrl,
    };
  });

  return { ...base, cells };
}

/**
 * Services / NMI heatmap data. Starts from the 90-cell scaffold (18 services
 * industries × 5 policy regimes) where every cell ships with score 0 and a
 * narrative explaining either (a) the regime predates Services PMI's 1997
 * launch, or (b) editorial research is pending. Then overlays Wayback-
 * derived scores onto the 18 Pandemic-regime cells from
 * data/services-industry-monthly-wayback.json — same pattern as the Mfg
 * loader. The other four regimes keep the placeholder narrative.
 */
export function loadSectorsServices(): SectorsFile {
  const base = sectorsFileSchema.parse(sectorsServicesRaw);
  const wayback = computeServicesPandemicIndustryScores();
  if (wayback.size === 0) return base;

  const cells = base.cells.map((c) => {
    if (c.regime !== "pandemic-reshoring") return c;
    const ws = wayback.get(c.industry);
    if (!ws) return c;
    return {
      ...c,
      score: ws.score,
      provenance: "wayback-archive" as const,
      narrative: `Reported growth in ${ws.growMonths} of ${ws.classifiedMonths} classified months between ${fmtMonth(ws.windowFirst)} and ${fmtMonth(ws.windowLast)} (per ISM monthly Services Reports on Business archived on Wayback). Score maps growth-share to the signed −100…+100 scale: 50% growing = 0.`,
      sourceUrl: ws.representativeSourceUrl,
    };
  });

  return { ...base, cells };
}

/**
 * Same algorithm as `computePandemicIndustryScores` for Manufacturing —
 * just sources from the Services industry-monthly file. Factored separately
 * because the Mfg & Services panels have completely different industry
 * names (only the algorithmic shape is shared).
 */
function computeServicesPandemicIndustryScores(): Map<string, PandemicScore> {
  const file = industryMonthlyFileSchema.parse(
    servicesIndustryMonthlyRaw,
  ) as IndustryMonthlyFile;
  const inRegime = file.observations.filter(
    (o) => o.date >= PANDEMIC_REGIME_START,
  );
  const scores = new Map<string, PandemicScore>();
  if (inRegime.length === 0) return scores;
  const windowFirst = inRegime[0]!.date;
  const windowLast = inRegime[inRegime.length - 1]!.date;
  const representativeSourceUrl = inRegime[0]!.sourceUrl;

  for (const industry of file.industries) {
    let g = 0;
    let c = 0;
    for (const obs of inRegime) {
      if (obs.growing.includes(industry)) g += 1;
      else if (obs.contracting.includes(industry)) c += 1;
    }
    const classified = g + c;
    if (classified < 6) continue;
    const growShare = g / classified;
    scores.set(industry, {
      industry,
      growMonths: g,
      contractMonths: c,
      classifiedMonths: classified,
      score: Math.round(growShare * 200 - 100),
      windowFirst,
      windowLast,
      representativeSourceUrl,
    });
  }
  return scores;
}
