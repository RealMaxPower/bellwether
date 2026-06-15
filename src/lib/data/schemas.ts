import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

/**
 * How a piece of data came to be in this repo. Drives UI badges and the
 * "no synthetic in production" CI check.
 */
export const provenanceSchema = z.enum([
  "fred",
  "nber",
  "ism-licensed",
  "hand-curated",
  "third-party-mirror",
  "wayback-archive",
  "synthetic",
]);
export type Provenance = z.infer<typeof provenanceSchema>;

export const provenanceLabels: Record<Provenance, string> = {
  fred: "FRED (Federal Reserve Bank of St. Louis)",
  nber: "NBER Business Cycle Dating Committee",
  "ism-licensed": "ISM (licensed redistribution)",
  "hand-curated": "Hand-curated from primary sources",
  "third-party-mirror": "Third-party mirror (factual values, ISM as primary origin)",
  "wayback-archive": "Wayback Machine archive of primary ISM Report on Business",
  synthetic: "Synthetic — development placeholder",
};

export const monthlyObservationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-01$/, "expected YYYY-MM-01"),
  value: z.number().finite(),
});
export type MonthlyObservation = z.infer<typeof monthlyObservationSchema>;

export const monthlySeriesSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  units: z.string(),
  provenance: provenanceSchema,
  lastVerifiedAt: isoDateSchema,
  // FRED's `realtime_end` for the pull, or the publish date for hand-curated data.
  vintage: z.string().optional(),
  observations: z.array(monthlyObservationSchema).min(1),
});
export type MonthlySeries = z.infer<typeof monthlySeriesSchema>;

export const recessionPeriodSchema = z.object({
  peak: z.string().regex(/^\d{4}-\d{2}-01$/),
  trough: z.string().regex(/^\d{4}-\d{2}-01$/),
  label: z.string().optional(),
  sourceUrl: z.string().url(),
});
export type RecessionPeriod = z.infer<typeof recessionPeriodSchema>;

export const recessionsFileSchema = z.object({
  id: z.literal("USREC"),
  title: z.string(),
  source: z.string(),
  provenance: provenanceSchema,
  lastVerifiedAt: isoDateSchema,
  periods: z.array(recessionPeriodSchema),
});
export type RecessionsFile = z.infer<typeof recessionsFileSchema>;

/**
 * Hand-curated observation: like a regular MonthlyObservation but each row
 * must cite the primary source it was transcribed from (typically an ISM
 * monthly Report on Business news release URL).
 */
export const curatedObservationSchema = monthlyObservationSchema.extend({
  sourceUrl: z.string().url(),
});
export type CuratedObservation = z.infer<typeof curatedObservationSchema>;

/**
 * Series populated by hand from primary sources. The observations array may
 * be empty (the file ships before any values are entered); the UI hides
 * dependent panels in that case.
 */
export const curatedSeriesSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  units: z.string(),
  provenance: provenanceSchema,
  lastVerifiedAt: isoDateSchema,
  observations: z.array(curatedObservationSchema),
});
export type CuratedSeries = z.infer<typeof curatedSeriesSchema>;

/**
 * Subindex names — the five components of the headline ISM PMI.
 */
export const subindexNames = [
  "newOrders",
  "production",
  "employment",
  "supplierDeliveries",
  "inventories",
] as const;
export type SubindexName = (typeof subindexNames)[number];

/**
 * One ISM Manufacturing Report on Business page → industries reporting
 * overall growth or contraction that month. The two arrays are normalized
 * to the canonical 18-industry list in `data/sectors.json`; an industry
 * mentioned in neither list is implicitly "not classified" for that month
 * (rare — the lists usually account for all 18).
 */
export const industryMonthlyRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-01$/),
  growing: z.array(z.string()),
  contracting: z.array(z.string()),
  sourceUrl: z.string().url(),
});
export type IndustryMonthlyRow = z.infer<typeof industryMonthlyRowSchema>;

export const industryMonthlyFileSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  provenance: provenanceSchema,
  lastVerifiedAt: isoDateSchema,
  /** The canonical 18 names; rows reference these. */
  industries: z.array(z.string()).length(18),
  observations: z.array(industryMonthlyRowSchema),
});
export type IndustryMonthlyFile = z.infer<typeof industryMonthlyFileSchema>;

/**
 * One ISM Manufacturing Report on Business page → one row with all six
 * values (composite + 5 subindices). Denormalized so the script writes one
 * row per scraped page; loaders project this into per-subindex MonthlySeries.
 */
export const subindexRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-01$/),
  composite: z.number().finite(),
  newOrders: z.number().finite(),
  production: z.number().finite(),
  employment: z.number().finite(),
  supplierDeliveries: z.number().finite(),
  inventories: z.number().finite(),
  sourceUrl: z.string().url(),
});
export type SubindexRow = z.infer<typeof subindexRowSchema>;

export const subindexRowsFileSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  units: z.string(),
  provenance: provenanceSchema,
  lastVerifiedAt: isoDateSchema,
  observations: z.array(subindexRowSchema),
});
export type SubindexRowsFile = z.infer<typeof subindexRowsFileSchema>;

export const subindexLabels: Record<SubindexName, string> = {
  newOrders: "New Orders",
  production: "Production",
  employment: "Employment",
  supplierDeliveries: "Supplier Deliveries",
  inventories: "Inventories",
};

/**
 * Default ISM Manufacturing weights — equal 20% across the five subindices
 * (the methodology in force since January 2008; pre-2008 weights were
 * 30/25/20/15/10 in the order New Orders / Production / Employment /
 * Supplier Deliveries / Inventories).
 */
export const ismDefaultWeights: Record<SubindexName, number> = {
  newOrders: 0.2,
  production: 0.2,
  employment: 0.2,
  supplierDeliveries: 0.2,
  inventories: 0.2,
};

/**
 * Services PMI subindex names — the four components of the headline NMI.
 * Note that Services uses Business Activity in place of Manufacturing's
 * Production, and Services has no Inventories component in its headline
 * (Inventories is reported but excluded from the composite).
 */
export const servicesSubindexNames = [
  "businessActivity",
  "newOrders",
  "employment",
  "supplierDeliveries",
] as const;
export type ServicesSubindexName = (typeof servicesSubindexNames)[number];

export const servicesSubindexLabels: Record<ServicesSubindexName, string> = {
  businessActivity: "Business Activity",
  newOrders: "New Orders",
  employment: "Employment",
  supplierDeliveries: "Supplier Deliveries",
};

/**
 * Default ISM Services weights — equal 25% across the four subindices.
 */
export const servicesDefaultWeights: Record<ServicesSubindexName, number> = {
  businessActivity: 0.25,
  newOrders: 0.25,
  employment: 0.25,
  supplierDeliveries: 0.25,
};

/**
 * One ISM Services Report on Business page → one row with the composite plus
 * the four headline subindices. Parallel to subindexRowSchema for Mfg.
 */
export const servicesSubindexRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-01$/),
  composite: z.number().finite(),
  businessActivity: z.number().finite(),
  newOrders: z.number().finite(),
  employment: z.number().finite(),
  supplierDeliveries: z.number().finite(),
  sourceUrl: z.string().url(),
});
export type ServicesSubindexRow = z.infer<typeof servicesSubindexRowSchema>;

export const servicesSubindexRowsFileSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  units: z.string(),
  provenance: provenanceSchema,
  lastVerifiedAt: isoDateSchema,
  observations: z.array(servicesSubindexRowSchema),
});
export type ServicesSubindexRowsFile = z.infer<typeof servicesSubindexRowsFileSchema>;
