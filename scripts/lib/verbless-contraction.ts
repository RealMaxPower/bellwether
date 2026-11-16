/**
 * The verbless ISM contraction sentence, which carries no month token:
 *
 *   "The three industries in contraction are: A; B; C."   (2026, plural)
 *   "The only industry in contraction was Chemical Products."   (2026-07)
 *
 * ISM writes it in both tenses, so the copula accepts are / is / was / were.
 * Missing the past tense is what left July 2026's manufacturing contraction
 * list empty, which pins that month's heatmap cells toward +100.
 *
 * It cannot be anchored on the month, so callers use it only as a fallback
 * after the month-anchored patterns found nothing, and only near the growth
 * list. The trailing methodology boilerplate "industries reporting contraction
 * or decreases" does not match: it has no "in" before "contraction".
 *
 * `noun` is the importer's industry-noun alternation, e.g.
 * "(?:industries|industry|manufacturing\\s+industries)". Capture group 1 is
 * the raw list.
 */
export function verblessContractionRe(noun: string): RegExp {
  return new RegExp(
    `${noun}\\s+in\\s+contraction\\s+(?:are|is|was|were)\\s*:?\\s*([A-Z][^.]+?)(?:\\.|$)`,
    "i",
  );
}
