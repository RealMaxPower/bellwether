import { timelineEntries, type TimelineEntry } from "./timeline";

/**
 * Lookup helpers so feature pages don't have to hand-code timeline-entry
 * IDs. Each helper returns the matching `TimelineEntry` or `null` if no
 * match — callers should defensively render nothing when null, not throw.
 */

const byId = new Map(timelineEntries.map((e) => [e.id, e]));

export function getEntryById(id: string): TimelineEntry | null {
  return byId.get(id) ?? null;
}

/**
 * Maps a Fed Chair scenario id (from src/lib/fed-chair/scenarios.ts) to the
 * timeline entry for that chair's tenure. Some scenarios share a chair
 * (Powell has two), so they map to the same entry.
 */
const SCENARIO_TO_CHAIR_ID: Record<string, string> = {
  "volcker-1979": "volcker-1979",
  "greenspan-1998": "greenspan-1987",
  "bernanke-2008": "bernanke-2006",
  "powell-2018": "powell-2018",
  "powell-2022": "powell-2018",
};

export function getScenarioChair(scenarioId: string): TimelineEntry | null {
  const chairId = SCENARIO_TO_CHAIR_ID[scenarioId];
  return chairId ? getEntryById(chairId) : null;
}

/**
 * Maps a Heatmap regime id (from data/sectors.json) to the timeline entry
 * for the chair who most defined that regime.
 */
const REGIME_TO_CHAIR_ID: Record<string, string> = {
  "bretton-woods": "martin-1951",
  stagflation: "burns-1970",
  "great-moderation": "greenspan-1987",
  "crisis-recovery": "bernanke-2006",
  "pandemic-reshoring": "powell-2018",
};

export function getRegimeChair(regimeId: string): TimelineEntry | null {
  const chairId = REGIME_TO_CHAIR_ID[regimeId];
  return chairId ? getEntryById(chairId) : null;
}

/**
 * Just the surname for compact UI labels — derived from the timeline
 * entry's title, which always starts with "Chair N — Firstname M. Surname".
 */
export function chairSurname(entry: TimelineEntry): string {
  // "Chair 12 — Paul A. Volcker" → "Volcker"
  const match = entry.title.match(/—\s*[^,]+?\s+([A-Z][a-z]+(?:\s+(?:Jr\.?|Sr\.?|III))?)$/);
  if (match) return match[1]!.replace(/\s+(Jr\.?|Sr\.?|III)$/, "");
  // Fallback: use the protagonist subtitle's first word, or the last word
  // of the title.
  const words = entry.title.split(/\s+/);
  return words[words.length - 1] ?? entry.title;
}
