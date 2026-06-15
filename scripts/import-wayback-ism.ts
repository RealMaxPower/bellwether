/**
 * Fill the post-2014 PMI gap by scraping ISM's monthly Manufacturing Report
 * on Business pages out of the Wayback Machine. Each row gets a stable
 * web.archive.org URL as its sourceUrl, so the citation chain remains
 * linkable even though the live ISM site is reCAPTCHA-gated.
 *
 * Two URL eras, both handled here:
 *   2014-09 → ~early 2018: http://www.ism.ws/ISMReport/MfgROB.cfm  (single
 *     rotating page; snapshot timestamp determines which month)
 *   2018-mid → present:    https://www.ismworld.org/...
 *                          /ism-report-on-business/pmi/{month_lowercase}/
 *
 * Two-phase design to be friendly to Wayback's rate limits:
 *   Phase 1 — index: 13 CDX queries total (one per modern monthly URL plus
 *     the legacy rotating URL), broad date ranges. Slept generously between
 *     queries.
 *   Phase 2 — extract: walk the candidate snapshots for each target
 *     (year, month), in chronological order, fetching pages until the title
 *     confirms the expected month/year and the regex extracts the value.
 *     Take the *earliest* match — captures the as-first-published value
 *     rather than ISM's silent later revisions.
 *
 * Output: data/pmi-wayback.json
 *   { id: "PMI-WAYBACK", provenance: "wayback-archive", observations: [...] }
 *
 * Usage:
 *   npx tsx scripts/import-wayback-ism.ts                        # 2014-09 → today
 *   npx tsx scripts/import-wayback-ism.ts 2014-09 2014-12        # explicit range
 *   npm run import-wayback
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_START = "2014-09";
const PAGE_SLEEP_MS = 2500; // between page fetches in phase 2
const CDX_SLEEP_MS = 5000; // between CDX queries in phase 1
const RETRY_DELAY_MS = 8000;
const MAX_RETRIES = 3;
const OUT_PATH = resolve(process.cwd(), "data", "pmi-wayback.json");
const CDX_CACHE_PATH = resolve(process.cwd(), "data", ".wayback-cdx-cache.json");
const CDX_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const PMI_REGEX =
  /PMI[^.]{0,300}?registered\s+(?:an\s+)?([0-9]{1,3}(?:\.[0-9])?)\s*percent/i;

type Row = { date: string; value: number; sourceUrl: string };
interface CdxRow {
  timestamp: string;
  original: string;
}

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

function ymd(year: number, month1to12: number, day = 1) {
  const mm = String(month1to12).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function parseYM(s: string): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(s);
  if (!m) throw new Error(`expected YYYY-MM, got ${s}`);
  return { year: Number(m[1]), month: Number(m[2]) };
}

function* monthRange(startYM: string, endYM: string): Generator<{ year: number; month: number }> {
  const s = parseYM(startYM);
  const e = parseYM(endYM);
  let y = s.year;
  let m = s.month;
  while (y < e.year || (y === e.year && m <= e.month)) {
    yield { year: y, month: m };
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
}

async function fetchWithRetry(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "BellwetherEduFetch/1.0 (educational, non-commercial)" },
      });
      if (res.status === 503 || res.status === 429) {
        if (attempt === MAX_RETRIES) return res;
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      return res;
    } catch {
      if (attempt === MAX_RETRIES) return null;
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }
  return null;
}

async function cdxQuery(
  targetUrl: string,
  windowStart: string,
  windowEnd: string,
): Promise<CdxRow[]> {
  const u =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(targetUrl)}` +
    `&from=${windowStart}&to=${windowEnd}` +
    `&filter=statuscode:200&collapse=digest&output=json&limit=1000`;
  const res = await fetchWithRetry(u);
  if (!res || !res.ok) return [];
  const text = await res.text();
  if (!text.trim() || text.trim() === "[]") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed) || parsed.length < 2) return [];
  const rows = parsed.slice(1) as unknown[][];
  return rows
    .map((r) => ({ timestamp: String(r[1]), original: String(r[2]) }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function cleanUrl(waybackUrl: string): string {
  // Wayback's CDX `original` field sometimes has doubled slashes
  // (e.g. `http://www.ism.ws//ismreport//mfgrob.cfm`). Collapse them while
  // preserving every `://` separator (the wrapping web.archive.org one and
  // the inner ism.ws one).
  return waybackUrl.replace(/(?<!:)\/{2,}/g, "/");
}

interface CdxCache {
  builtAt: number;
  modernByMonth: Record<string, CdxRow[]>;
  legacy: CdxRow[];
}

async function loadSnapshotIndex(): Promise<{
  modernByMonth: Map<string, CdxRow[]>;
  legacy: CdxRow[];
}> {
  // Use cached CDX index if fresh — keeps phase-1 CDX traffic out of the
  // way of phase-2 page-fetch traffic, which Wayback rate-limits separately
  // but together when bursted.
  if (existsSync(CDX_CACHE_PATH)) {
    try {
      const cache = JSON.parse(readFileSync(CDX_CACHE_PATH, "utf8")) as CdxCache;
      const age = Date.now() - cache.builtAt;
      if (age < CDX_CACHE_TTL_MS) {
        const modernByMonth = new Map<string, CdxRow[]>(
          Object.entries(cache.modernByMonth),
        );
        // Only use cache if every modern URL has at least *some* captures —
        // a 0-count entry means we hit a rate-limit during phase 1 and the
        // cache is incomplete; re-fetching just that month is cheap.
        const empties = MONTH_NAMES.filter(
          (n) => (modernByMonth.get(n) ?? []).length === 0,
        );
        if (empties.length === 0) {
          console.log(
            `Phase 1 — using cached CDX index (age ${Math.round(age / 60000)}m)`,
          );
          return { modernByMonth, legacy: cache.legacy };
        }
        console.log(
          `Phase 1 — cache exists but ${empties.length} URL(s) empty (${empties.join(", ")}); refreshing those`,
        );
        const refilled = await refreshEmptySlots(modernByMonth, empties);
        const updated: CdxCache = {
          builtAt: Date.now(),
          modernByMonth: Object.fromEntries(refilled),
          legacy: cache.legacy,
        };
        writeFileSync(CDX_CACHE_PATH, JSON.stringify(updated, null, 2));
        return { modernByMonth: refilled, legacy: cache.legacy };
      }
    } catch {
      // Cache corrupt: rebuild.
    }
  }

  console.log("Phase 1 — building snapshot index from Wayback CDX (13 queries)");
  const modernByMonth = new Map<string, CdxRow[]>();
  for (const [i, name] of MONTH_NAMES.entries()) {
    const rows = await cdxQueryModernMonth(name);
    modernByMonth.set(name, rows);
    console.log(`  [${i + 1}/13] modern /pmi/${name}/ → ${rows.length} snapshot(s)`);
    await sleep(CDX_SLEEP_MS);
  }
  const legacy = await cdxQuery(
    "http://www.ism.ws/ISMReport/MfgROB.cfm",
    "20140801",
    "20181231",
  );
  console.log(`  [13/13] legacy MfgROB.cfm → ${legacy.length} snapshot(s)`);

  const cache: CdxCache = {
    builtAt: Date.now(),
    modernByMonth: Object.fromEntries(modernByMonth),
    legacy,
  };
  writeFileSync(CDX_CACHE_PATH, JSON.stringify(cache, null, 2));
  return { modernByMonth, legacy };
}

async function cdxQueryModernMonth(monthName: string): Promise<CdxRow[]> {
  const url =
    `https://www.ismworld.org/supply-management-news-and-reports/reports/` +
    `ism-report-on-business/pmi/${monthName}/`;
  return cdxQuery(url, "20180101", "20261231");
}

async function refreshEmptySlots(
  modernByMonth: Map<string, CdxRow[]>,
  empties: string[],
): Promise<Map<string, CdxRow[]>> {
  for (const name of empties) {
    await sleep(CDX_SLEEP_MS);
    const rows = await cdxQueryModernMonth(name);
    modernByMonth.set(name, rows);
    console.log(`  refilled /pmi/${name}/ → ${rows.length} snapshot(s)`);
  }
  return modernByMonth;
}

interface ExtractResult {
  ok: true;
  row: Row;
}
interface ExtractFailure {
  ok: false;
  reason: string;
}

async function extractFromCandidates(
  candidates: CdxRow[],
  expectedMonthName: string,
  expectedYear: number,
): Promise<ExtractResult | ExtractFailure> {
  if (candidates.length === 0) {
    return { ok: false, reason: "no candidates in window" };
  }
  for (const cand of candidates) {
    const waybackUrl = cleanUrl(`https://web.archive.org/web/${cand.timestamp}/${cand.original}`);
    const res = await fetchWithRetry(waybackUrl);
    await sleep(PAGE_SLEEP_MS);
    if (!res || !res.ok) continue;
    const html = await res.text();

    // Title must contain the month name (binds the *page* to the right
    // calendar month). The year is bound separately by the release window
    // filter, because ISM redesigned the page sometime in 2024 and dropped
    // the year from <title> — older captures had "October 2014 Manufacturing
    // ISM Report On Business", newer ones just "October". We additionally
    // require the body to literally contain "{Month} {Year}" somewhere — that
    // clause survived the redesign.
    const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
    const title = titleMatch ? titleMatch[1]!.toLowerCase() : "";
    if (!title.includes(expectedMonthName)) continue;
    const monthCap =
      expectedMonthName.charAt(0).toUpperCase() + expectedMonthName.slice(1);
    if (!html.includes(`${monthCap} ${expectedYear}`)) continue;

    const valueMatch = PMI_REGEX.exec(html);
    if (!valueMatch) continue;
    const value = Number(valueMatch[1]);
    if (!Number.isFinite(value) || value < 0 || value > 100) continue;

    return {
      ok: true,
      row: { date: "", value, sourceUrl: waybackUrl }, // date set by caller
    };
  }
  return { ok: false, reason: `${candidates.length} candidate(s) but none matched title + regex` };
}

/**
 * Filter candidate CDX rows to those in the release window for {year, month}.
 * ISM publishes on the first business day of the next month; we widen to the
 * 1st through the 15th of the following month (45-day cushion past that).
 */
function filterToReleaseWindow(
  candidates: CdxRow[],
  year: number,
  month: number,
): CdxRow[] {
  // The data for {year, month} appears on snapshots from {year, month+1} onward
  // until next year's {year+1, month} edition overwrites the page.
  const releaseStart =
    String(month === 12 ? year + 1 : year) +
    String(month === 12 ? 1 : month + 1).padStart(2, "0") +
    "01";
  const releaseEnd =
    String(month === 12 ? year + 1 : year + 1) +
    String(month).padStart(2, "0") +
    "15";
  return candidates.filter(
    (c) => c.timestamp.slice(0, 8) >= releaseStart && c.timestamp.slice(0, 8) <= releaseEnd,
  );
}

async function main() {
  const argv = process.argv.slice(2);
  const today = new Date();
  const todayY = today.getUTCFullYear();
  const todayM = today.getUTCMonth() + 1;
  const cutoffM = todayM <= 2 ? 12 : todayM - 2;
  const cutoffY = todayM <= 2 ? todayY - 1 : todayY;
  const defaultEnd = `${cutoffY}-${String(cutoffM).padStart(2, "0")}`;
  const startYM = argv[0] ?? DEFAULT_START;
  const endYM = argv[1] ?? defaultEnd;

  const existing = new Map<string, Row>();
  if (existsSync(OUT_PATH)) {
    try {
      const prev = JSON.parse(readFileSync(OUT_PATH, "utf8")) as { observations: Row[] };
      for (const o of prev.observations ?? []) existing.set(o.date, o);
    } catch {
      // Corrupt file: start fresh.
    }
  }

  const months = Array.from(monthRange(startYM, endYM));
  const todo = months.filter((m) => !existing.has(ymd(m.year, m.month, 1)));
  console.log(
    `Filling ${months.length} month(s) from ${startYM} → ${endYM}\n` +
      `  ${existing.size} already cached (will skip)\n` +
      `  ${todo.length} to fetch`,
  );

  const { modernByMonth, legacy } = await loadSnapshotIndex();

  console.log(`\nPhase 2 — extracting PMI from snapshot pages`);

  const collected: Row[] = Array.from(existing.values());
  const failures: { date: string; reason: string }[] = [];

  function flush() {
    collected.sort((a, b) => a.date.localeCompare(b.date));
    const today_iso = new Date().toISOString().slice(0, 10);
    const out = {
      id: "PMI-WAYBACK",
      title: "ISM Manufacturing PMI Composite (Wayback archive of primary releases)",
      source:
        "Wayback Machine archive of ISM monthly Manufacturing Report on Business pages — values originate with ISM",
      units: "Index",
      provenance: "wayback-archive",
      lastVerifiedAt: today_iso,
      observations: collected,
    };
    writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`);
  }
  flush(); // create the file early so series.ts imports work mid-run

  let done = 0;
  for (const { year, month } of todo) {
    done += 1;
    const date = ymd(year, month, 1);
    const monthName = MONTH_NAMES[month - 1]!;

    // Try modern URL first (post-2018). Only fall back to legacy if modern
    // had zero candidates (genuine miss, not a fetch failure) — otherwise
    // the legacy fallback's "no candidates in window" would mask the real
    // (transient, recoverable) error.
    const allModern = modernByMonth.get(monthName) ?? [];
    const modernCandidates = filterToReleaseWindow(allModern, year, month);
    if (process.env.DEBUG_WAYBACK) {
      console.log(
        `    debug ${date}: month=${monthName} totalModern=${allModern.length} inWindow=${modernCandidates.length}`,
      );
    }
    let result: ExtractResult | ExtractFailure;
    if (modernCandidates.length === 0) {
      const legacyCandidates = filterToReleaseWindow(legacy, year, month);
      result = await extractFromCandidates(legacyCandidates, monthName, year);
    } else {
      result = await extractFromCandidates(modernCandidates, monthName, year);
    }

    if (result.ok) {
      const row: Row = { ...result.row, date };
      collected.push(row);
      console.log(`  [${done}/${todo.length}] ${date}  PMI=${row.value.toFixed(1)}  ✓`);
      flush();
    } else {
      failures.push({ date, reason: result.reason });
      console.log(`  [${done}/${todo.length}] ${date}  ${result.reason}  ✗`);
    }
  }

  flush();
  const today_iso = new Date().toISOString().slice(0, 10);
  console.log(
    `\nWrote ${collected.length} observation(s) to data/pmi-wayback.json (verified ${today_iso}).`,
  );
  if (failures.length > 0) {
    console.log(`\n${failures.length} month(s) failed; will need a manual look:`);
    for (const f of failures) console.log(`  ${f.date}  ${f.reason}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
