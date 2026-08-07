/**
 * Pulling one ISM subindex value out of a Report on Business page.
 *
 * Extracted from import-wayback-subindices.ts and
 * import-wayback-nmi-subindices.ts, where it was duplicated verbatim and
 * edited in lockstep three times. Neither importer is reachable from a test —
 * both call main() on import — so the logic lives here to be unit-testable,
 * the same reason scripts/lib/cdx-index.ts exists.
 *
 * The whole difficulty is that a page names each index several times and only
 * one of those mentions carries the month's actual value. The others are
 * summaries, comparisons against the prior month, or historical references.
 * Every failure this has produced stored a plausible-looking number under the
 * wrong name — nothing about the value itself looked wrong, and only the
 * composite check in scripts/reconcile-ism.ts (subindex mean must reproduce
 * the headline) ever caught them.
 *
 * Four patterns, tried most-specific first. Order is the correctness
 * mechanism, not a performance choice: LOOSE will match something on almost
 * any page, so anything more precise has to be given the chance to win.
 */

/** Component labels are interpolated raw, so they must be regex-safe. */
export type SubindexName = string;

/**
 * ISM's canonical phrasing: "{name} Index registered N percent".
 *
 * `register(?:ed|ing)\s+[^.0-9]{0,40}?` allows a qualifier before the number —
 * ISM writes "registered an all-time high of 63.7 percent". Demanding the
 * number immediately after "registered" made that sentence fail, so the search
 * fell through to a later comparison clause and stored a value from a
 * different year. `[^.0-9]` keeps the qualifier inside one sentence.
 */
export const SUB_RE_STRICT = (name: SubindexName) =>
  new RegExp(
    `${name}\\s*Index\\s+register(?:ed|ing)\\s+[^.0-9]{0,40}?(\\d{1,3}(?:\\.\\d)?)\\s*percent\\b(?!age)`,
    "i",
  );

/**
 * "the reading of N percent is X points lower than ..." — used for components
 * that are never "registered".
 *
 * The definite article is deliberate. March 2026 also contained "dropped from
 * February's reading of 59.9 percent to 53.9 percent"; a bare "reading of"
 * would have taken February's number.
 */
export const SUB_RE_READING = (name: SubindexName) =>
  new RegExp(
    `${name}\\s*Index(?:(?!Index)[^.]){0,200}?\\bthe reading of (\\d{1,3}(?:\\.\\d)?)\\s*percent\\b(?!age)`,
    "i",
  );

/**
 * "Employment activity in the services sector grew in June ... ; the index
 * registered 53.1 percent".
 *
 * The only tier that does not require the literal token `Index` after the
 * component name, because this phrasing never writes "Employment Index" at
 * all. That is why June 2023 Services extracted nothing: all the other tiers
 * anchor on `{name} Index`, and a single missing component drops the whole
 * month.
 *
 * Requiring both "{name} activity" and "the index registered" keeps it narrow.
 */
export const SUB_RE_ACTIVITY = (name: SubindexName) =>
  new RegExp(
    `${name}\\s+activity[^.]{0,200}?\\bthe index registered\\s+(\\d{1,3}(?:\\.\\d)?)\\s*percent\\b(?!age)`,
    "i",
  );

/**
 * Last resort, for older pages that phrase it some other way.
 *
 * `(?:(?!Index)[^.])` is a tempered token — non-period characters that do not
 * begin another "... Index" mention. The period bound alone was not enough:
 * ISM packs several indices into one sentence, and March 2026 read "the
 * Supplier Deliveries Index indicated increasingly slowing deliveries, the
 * Inventories Index contracted at a faster rate, and the Prices Index took
 * another big leap - to 78.3 percent", so an anchor on Supplier Deliveries
 * skated past two other indices and captured the Prices value.
 */
export const SUB_RE_LOOSE = (name: SubindexName) =>
  new RegExp(
    `${name}\\s*Index(?:(?!Index)[^.]){0,150}?(\\d{1,3}(?:\\.\\d)?)\\s*percent\\b(?!age)`,
    "i",
  );

/** Most-specific first; the first tier that matches wins. */
export const SUB_RE_TIERS = [
  SUB_RE_STRICT,
  SUB_RE_READING,
  SUB_RE_ACTIVITY,
  SUB_RE_LOOSE,
] as const;

/**
 * First match across the tiers, or null if the page names the component in no
 * recognised way.
 *
 * Callers treat null as "drop this month" rather than writing a partial row.
 * A partial row would not slip through — reconcile-ism.ts rejects any row with
 * a non-numeric component — but failing at write time keeps the data file
 * clean instead of relying on a downstream catch, and the dropped month is
 * then visible as a coverage gap.
 */
export function matchSubindex(name: SubindexName, html: string): RegExpExecArray | null {
  for (const tier of SUB_RE_TIERS) {
    const m = tier(name).exec(html);
    if (m) return m;
  }
  return null;
}
