import { z } from "zod";

export const policyKindSchema = z.enum(["monetary", "fiscal", "trade", "regulatory", "exogenous"]);
export type PolicyKind = z.infer<typeof policyKindSchema>;

export const policyKindLabels: Record<PolicyKind, string> = {
  monetary: "Monetary",
  fiscal: "Fiscal",
  trade: "Trade",
  regulatory: "Regulatory",
  exogenous: "Exogenous shock",
};

export const economicSchoolSchema = z.enum([
  "keynesian",
  "monetarist",
  "supply-side",
  "neoclassical",
  "post-keynesian",
  "austrian",
  "structural",
]);
export type EconomicSchool = z.infer<typeof economicSchoolSchema>;

export const economicSchoolLabels: Record<EconomicSchool, string> = {
  keynesian: "Keynesian",
  monetarist: "Monetarist",
  "supply-side": "Supply-side",
  neoclassical: "Neoclassical",
  "post-keynesian": "Post-Keynesian",
  austrian: "Austrian",
  structural: "Structural",
};

export const interpretationSchema = z.object({
  school: economicSchoolSchema,
  economist: z.string(),
  summary: z.string(),
  evidence: z.string().optional(),
});
export type Interpretation = z.infer<typeof interpretationSchema>;

export const sourceSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  kind: z.enum(["primary", "secondary"]).optional(),
});
export type Source = z.infer<typeof sourceSchema>;

export const ismCommentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-01$/),
  industry: z.string().optional(),
  quote: z.string(),
  sourceUrl: z.string().url().optional(),
});
export type ISMComment = z.infer<typeof ismCommentSchema>;

export const policyFrontmatterSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, "id must be kebab-case"),
    title: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-01$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-01$/).optional(),
    regime: z.string(),
    kind: policyKindSchema,
    isExogenous: z.boolean().default(false),
    summary: z.string(),
    interpretations: z.array(interpretationSchema).min(1),
    sources: z.array(sourceSchema).min(1),
    ismComments: z.array(ismCommentSchema).default([]),
    verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  });
export type PolicyFrontmatter = z.infer<typeof policyFrontmatterSchema>;
