/**
 * Fill the Services PMI / NMI series by scraping ISM's monthly Services
 * Report on Business pages out of the Wayback Machine. Parallel to
 * `import-wayback-ism.ts` for Manufacturing, with two material differences:
 *
 *   1. The series only starts in mid-1997 (first month of regular Services
 *      data collection per ISM history). Default start is 2014-09 to match
 *      the Mfg pipeline; widen explicitly via CLI args for older months.
 *   2. URL pattern uses `/services/` not `/pmi/` on the modern era, and the
 *      legacy rotating page is `NonMfgROB.cfm` not `MfgROB.cfm`.
 *
 * Output: data/nmi-wayback.json
 *
 * Usage:
 *   npx tsx scripts/import-wayback-nmi.ts                        # 2014-09 → today
 *   npx tsx scripts/import-wayback-nmi.ts 2014-09 2014-12        # explicit range
 *   npm run import-wayback-nmi
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  isCacheUsable,
  resolveMonth,
  type CdxRow,
  type MonthQueryResult,
} from "./lib/cdx-index";

const DEFAULT_START = "2014-09";
const PAGE_SLEEP_MS = 2500;
const CDX_SLEEP_MS = 5000;
const RETRY_DELAY_MS = 8000;
const MAX_RETRIES = 3;
const OUT_PATH = resolve(process.cwd(), "data", "nmi-wayback.json");
const CDX_CACHE_PATH = resolve(process.cwd(), "data", ".wayback-nmi-cdx-cache.json");
const CDX_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// Bump when the set of URLs cdxQueryModernMonth queries changes, so a cache
// written by an older build is discarded even while still inside its TTL.
const CDX_CACHE_VERSION = 2;

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// ISM Services releases sometimes lead with "Services PMI registered ..." and
// sometimes "NMI registered ..." (terminology diverged across the 2021
// rename). Match either and the rare "NMI® registered" variant.
// `registered\s+[^.0-9]{0,40}?` rather than `registered\s+(?:an\s+)?`: ISM
// often writes "registered an all-time high of 63.7 percent". Requiring the
// number to follow "registered" immediately made March 2021 fail to match, so
// the search fell through to the next sentence — "the previous high was in
// October 2018, when the Services PMI registered 60.9 percent" — and stored a
// 2018 value as March 2021. `[^.0-9]` keeps the qualifier inside one sentence.
const NMI_REGEX =
  /(?:Services\s+PMI|NMI)[®\s]*[^.]{0,300}?registered\s+[^.0-9]{0,40}?([0-9]{1,3}(?:\.[0-9])?)\s*percent/i;

type Row = { date: string; value: number; sourceUrl: string };

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
): Promise<CdxRow[] | null> {
  const u =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(targetUrl)}` +
    `&from=${windowStart}&to=${windowEnd}` +
    `&filter=statuscode:200&collapse=digest&output=json&limit=1000`;
  const res = await fetchWithRetry(u);
  // null means "could not answer" (network error, non-2xx, unparseable body);
  // [] means "Wayback genuinely has no matching captures". Collapsing both to
  // [] made a transient archive.org failure indistinguishable from a URL that
  // was never archived, which is how a cached index silently got zeroed.
  if (!res || !res.ok) return null;
  const text = await res.text();
  if (!text.trim() || text.trim() === "[]") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  if (parsed.length < 2) return [];
  const rows = parsed.slice(1) as unknown[][];
  return rows
    .map((r) => ({ timestamp: String(r[1]), original: String(r[2]) }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function cleanUrl(waybackUrl: string): string {
  return waybackUrl.replace(/(?<!:)\/{2,}/g, "/");
}

interface CdxCache {
  version?: number;
  builtAt: number;
  modernByMonth: Record<string, CdxRow[]>;
  legacy: CdxRow[];
}

// ISM renamed the path segment from `ism-report-on-business` to
// `ism-pmi-reports` around mid-2025. The old URLs now 301 to the new ones, so
// Wayback still records hits against them but only as redirects — which
// cdxQuery's `filter=statuscode:200` correctly discards. Querying the old
// path alone therefore went silently empty from 2025-08 onward. Query both:
// the old path holds the pre-rename history, the new one everything since.
const MODERN_PATH_SEGMENTS = ["ism-report-on-business", "ism-pmi-reports"] as const;

/**
 * null  — every path era failed, we learned nothing.
 * complete:false — at least one era answered but another failed, so the rows
 *   are a floor rather than the full set and must not replace a richer index.
 */
async function cdxQueryModernMonth(
  monthName: string,
): Promise<MonthQueryResult> {
  const rows: CdxRow[] = [];
  let answered = 0;
  let failed = 0;
  for (const [i, segment] of MODERN_PATH_SEGMENTS.entries()) {
    if (i > 0) await sleep(CDX_SLEEP_MS);
    const url =
      `https://www.ismworld.org/supply-management-news-and-reports/reports/` +
      `${segment}/services/${monthName}/`;
    const got = await cdxQuery(url, "20180101", "20261231");
    if (got === null) {
      console.warn(`    ! CDX query failed: ${segment}/services/${monthName}/`);
      failed += 1;
      continue;
    }
    answered += 1;
    rows.push(...got);
  }
  if (answered === 0) return null;
  return {
    rows: rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    complete: failed === 0,
  };
}

async function loadSnapshotIndex(): Promise<{
  modernByMonth: Map<string, CdxRow[]>;
  legacy: CdxRow[];
}> {
  // Whatever is on disk, even if stale or the wrong version. A rebuild falls
  // back to it for any query that fails, so a bad day at archive.org degrades
  // to "kept the previous index" rather than "wrote an empty one".
  let previous: CdxCache | null = null;
  if (existsSync(CDX_CACHE_PATH)) {
    try {
      const cache = JSON.parse(readFileSync(CDX_CACHE_PATH, "utf8")) as CdxCache;
      previous = cache;
      const age = Date.now() - cache.builtAt;
      if (
        isCacheUsable({
          version: cache.version,
          expectedVersion: CDX_CACHE_VERSION,
          ageMs: age,
          ttlMs: CDX_CACHE_TTL_MS,
          legacyCount: cache.legacy?.length ?? 0,
        })
      ) {
        const modernByMonth = new Map<string, CdxRow[]>(
          Object.entries(cache.modernByMonth),
        );
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
        for (const name of empties) {
          await sleep(CDX_SLEEP_MS);
          const got = await cdxQueryModernMonth(name);
          const { rows, note } = resolveMonth(got, modernByMonth.get(name) ?? []);
          modernByMonth.set(name, rows);
          console.log(`  refilled /services/${name}/ → ${rows.length} snapshot(s)${note}`);
        }
        const updated: CdxCache = {
          version: CDX_CACHE_VERSION,
          builtAt: Date.now(),
          modernByMonth: Object.fromEntries(modernByMonth),
          legacy: cache.legacy,
        };
        writeFileSync(CDX_CACHE_PATH, JSON.stringify(updated, null, 2));
        return { modernByMonth, legacy: cache.legacy };
      }
    } catch {
      // Corrupt: rebuild.
    }
  }

  console.log(
    `Phase 1 — building snapshot index from Wayback CDX ` +
      `(${MONTH_NAMES.length * MODERN_PATH_SEGMENTS.length + 1} queries)`,
  );
  const modernByMonth = new Map<string, CdxRow[]>();
  for (const [i, name] of MONTH_NAMES.entries()) {
    const got = await cdxQueryModernMonth(name);
    const { rows, note } = resolveMonth(got, previous?.modernByMonth?.[name] ?? []);
    modernByMonth.set(name, rows);
    console.log(
      `  [${i + 1}/13] modern /services/${name}/ → ${rows.length} snapshot(s)${note}`,
    );
    await sleep(CDX_SLEEP_MS);
  }
  const legacyRows = await cdxQuery(
    "http://www.ism.ws/ISMReport/NonMfgROB.cfm",
    "20140801",
    "20181231",
  );
  const legacy = legacyRows ?? previous?.legacy ?? [];
  console.log(
    `  [13/13] legacy NonMfgROB.cfm → ${legacy.length} snapshot(s)` +
      (legacyRows === null ? " (query failed — kept previous)" : ""),
  );

  const cache: CdxCache = {
    version: CDX_CACHE_VERSION,
    builtAt: Date.now(),
    modernByMonth: Object.fromEntries(modernByMonth),
    legacy,
  };
  writeFileSync(CDX_CACHE_PATH, JSON.stringify(cache, null, 2));
  return { modernByMonth, legacy };
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

    const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
    const title = titleMatch ? titleMatch[1]!.toLowerCase() : "";
    if (!title.includes(expectedMonthName)) continue;
    const monthCap =
      expectedMonthName.charAt(0).toUpperCase() + expectedMonthName.slice(1);
    if (!html.includes(`${monthCap} ${expectedYear}`)) continue;

    const valueMatch = NMI_REGEX.exec(html);
    if (!valueMatch) continue;
    const value = Number(valueMatch[1]);
    if (!Number.isFinite(value) || value < 0 || value > 100) continue;

    return {
      ok: true,
      row: { date: "", value, sourceUrl: waybackUrl },
    };
  }
  return { ok: false, reason: `${candidates.length} candidate(s) but none matched title + regex` };
}

function filterToReleaseWindow(
  candidates: CdxRow[],
  year: number,
  month: number,
): CdxRow[] {
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
      const prev = JSON.parse(readFileSync(OUT_PATH, "utf8")) as {
        provenance?: string;
        observations: Row[];
      };
      // If the file ships as synthetic placeholders, ignore those rows when
      // computing what's "already collected" — the real scraper run should
      // overwrite them entirely.
      if (prev.provenance !== "synthetic") {
        for (const o of prev.observations ?? []) existing.set(o.date, o);
      }
    } catch {
      // Corrupt: rebuild.
    }
  }

  const months = Array.from(monthRange(startYM, endYM));
  const todo = months.filter((m) => !existing.has(ymd(m.year, m.month, 1)));
  console.log(
    `Filling ${months.length} Services month(s) from ${startYM} → ${endYM}\n` +
      `  ${existing.size} already cached (will skip)\n` +
      `  ${todo.length} to fetch`,
  );

  const { modernByMonth, legacy } = await loadSnapshotIndex();

  console.log(`\nPhase 2 — extracting NMI from snapshot pages`);

  const collected: Row[] = Array.from(existing.values());
  const failures: { date: string; reason: string }[] = [];

  function flush() {
    collected.sort((a, b) => a.date.localeCompare(b.date));
    const today_iso = new Date().toISOString().slice(0, 10);
    const out = {
      id: "NMI-WAYBACK",
      title:
        "ISM Services PMI / NMI Composite (Wayback archive of primary releases)",
      source:
        "Wayback Machine archive of ISM monthly Services Report on Business pages — values originate with ISM",
      units: "Index",
      provenance: "wayback-archive",
      lastVerifiedAt: today_iso,
      observations: collected,
    };
    writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`);
  }
  flush();

  let done = 0;
  for (const { year, month } of todo) {
    done += 1;
    const date = ymd(year, month, 1);
    const monthName = MONTH_NAMES[month - 1]!;

    const allModern = modernByMonth.get(monthName) ?? [];
    const modernCandidates = filterToReleaseWindow(allModern, year, month);
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
      console.log(`  [${done}/${todo.length}] ${date}  NMI=${row.value.toFixed(1)}  ✓`);
      flush();
    } else {
      failures.push({ date, reason: result.reason });
      console.log(`  [${done}/${todo.length}] ${date}  ${result.reason}  ✗`);
    }
  }

  flush();
  const today_iso = new Date().toISOString().slice(0, 10);
  console.log(
    `\nWrote ${collected.length} observation(s) to data/nmi-wayback.json (verified ${today_iso}).`,
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
