import { cache } from "../cache";
import { policyFrontmatterSchema, type PolicyFrontmatter } from "./policy-schema";
import { policiesData } from "./_policies-data";

/**
 * Load all policy events. In v1 these are seeded from a TS module so the
 * project runs without an MDX runtime; the loader stays pluggable so we can
 * swap in MDX file globbing once we wire next-mdx-remote.
 */
export const loadPolicies = cache((): readonly PolicyFrontmatter[] => {
  const parsed = policiesData.map((entry, index) => {
    const result = policyFrontmatterSchema.safeParse(entry);
    if (!result.success) {
      throw new Error(
        `Policy at index ${index} (id=${(entry as { id?: string }).id ?? "?"}) failed schema validation: ${result.error.message}`,
      );
    }
    return result.data;
  });
  // Sort by start date for deterministic timeline ordering.
  return parsed.slice().sort((a, b) => a.startDate.localeCompare(b.startDate));
});

export const findPolicyById = cache((id: string): PolicyFrontmatter | undefined =>
  loadPolicies().find((p) => p.id === id),
);
