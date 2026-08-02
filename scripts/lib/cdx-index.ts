/**
 * Shared helpers for folding Wayback CDX query results into a cached snapshot
 * index. Extracted from the two importers (import-wayback-ism.ts and
 * import-wayback-nmi.ts) so the logic is defined once and can be unit-tested:
 * those scripts call main() on import, so nothing inside them is reachable
 * from a test.
 *
 * The distinction this module exists to preserve: a CDX query that *fails*
 * must never be mistaken for one that legitimately returned nothing. Treating
 * the two alike is how a transient archive.org error silently zeroed a
 * committed index — the query returned [], the index recorded "no captures
 * exist", and the emptiness looked authoritative.
 */

export interface CdxRow {
  timestamp: string;
  original: string;
}

/**
 * Outcome of querying every URL era for a single month.
 *
 * `null`            — every era failed; we learned nothing at all.
 * `complete: false` — at least one era answered and another failed, so these
 *                     rows are a floor, not the full set.
 * `complete: true`  — every era answered; the rows are authoritative.
 */
export type MonthQueryResult = { rows: CdxRow[]; complete: boolean } | null;

/** Union two candidate lists, de-duplicated on the identity Wayback uses. */
export function mergeRows(a: CdxRow[], b: CdxRow[]): CdxRow[] {
  const seen = new Map<string, CdxRow>();
  for (const r of [...a, ...b]) seen.set(`${r.timestamp}|${r.original}`, r);
  return [...seen.values()].sort((x, y) => x.timestamp.localeCompare(y.timestamp));
}

/**
 * Fold a query result against whatever the previous index held for that month,
 * so neither a total nor a partial failure can shrink a candidate list. Extra
 * candidates are harmless — callers filter by release window and page title
 * anyway — whereas missing ones cause months to silently fail extraction.
 */
export function resolveMonth(
  got: MonthQueryResult,
  prior: CdxRow[],
): { rows: CdxRow[]; note: string } {
  if (got === null) return { rows: prior, note: " (query failed — kept previous)" };
  if (!got.complete) {
    return { rows: mergeRows(got.rows, prior), note: " (partial — merged with previous)" };
  }
  return { rows: got.rows, note: "" };
}

/**
 * Whether a cached index can be trusted enough to skip a rebuild.
 *
 * A zero-length legacy list is treated as suspect rather than factual: the
 * legacy ISM URLs are known to have captures, so empty means an earlier query
 * failed. This has to gate the *whole* cached branch, because the partial
 * refill path only repairs per-month entries — a hollow legacy list can only
 * be re-queried by a full rebuild.
 */
export function isCacheUsable(params: {
  version: number | undefined;
  expectedVersion: number;
  ageMs: number;
  ttlMs: number;
  legacyCount: number;
}): boolean {
  return (
    params.version === params.expectedVersion &&
    params.ageMs < params.ttlMs &&
    params.legacyCount > 0
  );
}
