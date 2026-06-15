import { cache } from "../cache";
import { glossaryTermSchema, type GlossaryTerm } from "./glossary-schema";
import { glossaryData } from "./glossary-data";

/**
 * Load all glossary terms. Validates each entry at module-import time so
 * malformed seeds surface as build/test failures rather than missing popovers.
 */
export const loadGlossary = cache((): readonly GlossaryTerm[] => {
  const parsed = glossaryData.map((entry, index) => {
    const result = glossaryTermSchema.safeParse(entry);
    if (!result.success) {
      throw new Error(
        `Glossary term at index ${index} (slug=${(entry as { slug?: string }).slug ?? "?"}) failed schema validation: ${result.error.message}`,
      );
    }
    return result.data;
  });
  return parsed.slice().sort((a, b) => a.slug.localeCompare(b.slug));
});

/**
 * Look up a single glossary term by slug. Returns undefined for unknown slugs;
 * callers should treat that as a soft failure (render the children plain
 * rather than throw).
 */
export const findGlossaryTerm = cache((slug: string): GlossaryTerm | undefined =>
  loadGlossary().find((t) => t.slug === slug),
);

/**
 * Eager map keyed by slug. Built once per process; useful when wiring many
 * `<GlossaryTerm>` callers on the same page.
 */
export const glossaryBySlug = cache((): ReadonlyMap<string, GlossaryTerm> => {
  const map = new Map<string, GlossaryTerm>();
  for (const t of loadGlossary()) map.set(t.slug, t);
  return map;
});
