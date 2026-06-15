import type { MonthlyObservation, RecessionPeriod } from "@/lib/data/schemas";

export interface BacktestResult {
  /** Number of recessions where the blend dipped below 50 in the 6 months prior. */
  hits: number;
  /** Total number of recessions whose peak falls in the dataset window. */
  recessions: number;
  /**
   * Recessions in the window for which we have at least one data point
   * inside the 6-month pre-window (i.e. the prediction can actually be
   * checked). The rest are skipped — neither hits nor misses.
   */
  evaluable: number;
  /** hits / evaluable, or 0 if no evaluable recessions fall in the window. */
  hitRate: number;
  /** Number of below-50 readings outside the 6-month pre-recession window. */
  falsePositiveCount: number;
}

/**
 * For each recession period, check whether the blend signaled below 50 at
 * least once in the 6 months preceding the peak. Reports both hit rate and
 * false-positive count to give a fair picture of the signal.
 */
export function recessionBacktest(
  blend: readonly MonthlyObservation[],
  recessions: readonly RecessionPeriod[],
): BacktestResult {
  if (blend.length === 0) {
    return {
      hits: 0,
      recessions: recessions.length,
      evaluable: 0,
      hitRate: 0,
      falsePositiveCount: 0,
    };
  }

  const startDate = blend[0]!.date;
  const endDate = blend[blend.length - 1]!.date;

  const inWindow = (peak: string) => peak >= startDate && peak <= endDate;
  const inWindowRecessions = recessions.filter((r) => inWindow(r.peak));

  // Build a flat date->value map for window lookups.
  const map = new Map(blend.map((o) => [o.date, o.value]));

  // Pre-compute pre-recession windows so we can detect false positives.
  const preWindows = new Set<string>();
  for (const r of inWindowRecessions) {
    const dates = monthsBefore(r.peak, 6);
    for (const d of dates) preWindows.add(d);
  }

  let hits = 0;
  let evaluable = 0;
  for (const r of inWindowRecessions) {
    const window = monthsBefore(r.peak, 6);
    const haveAnyData = window.some((d) => map.has(d));
    if (!haveAnyData) continue; // unevaluable: no data in the pre-window
    evaluable += 1;
    const dipped = window.some((d) => {
      const v = map.get(d);
      return v !== undefined && v < 50;
    });
    if (dipped) hits += 1;
  }

  let falsePositives = 0;
  for (const o of blend) {
    if (o.value < 50 && !preWindows.has(o.date) && !inAnyRecession(o.date, recessions)) {
      falsePositives += 1;
    }
  }

  return {
    hits,
    recessions: inWindowRecessions.length,
    evaluable,
    hitRate: evaluable === 0 ? 0 : hits / evaluable,
    falsePositiveCount: falsePositives,
  };
}

function monthsBefore(iso: string, n: number): string[] {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return [];
  const out: string[] = [];
  for (let i = 1; i <= n; i += 1) {
    let mm = m - i;
    let yy = y;
    while (mm <= 0) {
      mm += 12;
      yy -= 1;
    }
    out.push(`${yy}-${String(mm).padStart(2, "0")}-01`);
  }
  return out;
}

function inAnyRecession(iso: string, recessions: readonly RecessionPeriod[]): boolean {
  return recessions.some((r) => iso >= r.peak && iso <= r.trough);
}
