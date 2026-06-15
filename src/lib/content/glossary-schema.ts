import { z } from "zod";

/**
 * A single glossary entry. `slug` is the stable lookup key referenced from
 * pages via `<GlossaryTerm slug="...">`; `term` is the canonical display name.
 * `definition` is the full popover body (one to three short sentences).
 */
export const glossaryTermSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  term: z.string().min(1),
  definition: z.string().min(20),
  related: z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),
});
export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;
