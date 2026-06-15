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

const DEFAULT_START = "2014-09";
const PAGE_SLEEP_MS = 2500;
const CDX_SLEEP_MS = 5000;
const RETRY_DELAY_MS = 8000;
const MAX_RETRIES = 3;
const OUT_PATH = resolve(process.cwd(), "data", "nmi-wayback.json");
const CDX_CACHE_PATH = resolve(process.cwd(), "data", ".wayback-nmi-cdx-cache.json");
const CDX_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// ISM Services releases sometimes lead with "Services PMI registered ..." and
// sometimes "NMI registered ..." (terminology diverged across the 2021
// rename). Match either and the rare "NMI® registered" variant.
const NMI_REGEX =
  /(?:Services\s+PMI|NMI)[®\s]*[^.]{0,300}?registered\s+(?:an\s+)?([0-9]{1,3}(?:\.[0-9])?)\s*percent/i;

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
  return waybackUrl.replace(/(?<!:)\/{2,}/g, "/");
}

interface CdxCache {
  builtAt: number;
  modernByMonth: Record<string, CdxRow[]>;
  legacy: CdxRow[];
}

async function cdxQueryModernMonth(monthName: string): Promise<CdxRow[]> {
  const url =
    `https://www.ismworld.org/supply-management-news-and-reports/reports/` +
    `ism-report-on-business/services/${monthName}/`;
  return cdxQuery(url, "20180101", "20261231");
}

async function loadSnapshotIndex(): Promise<{
  modernByMonth: Map<string, CdxRow[]>;
  legacy: CdxRow[];
}> {
  if (existsSync(CDX_CACHE_PATH)) {
    try {
      const cache = JSON.parse(readFileSync(CDX_CACHE_PATH, "utf8")) as CdxCache;
      const age = Date.now() - cache.builtAt;
      if (age < CDX_CACHE_TTL_MS) {
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
          const rows = await cdxQueryModernMonth(name);
          modernByMonth.set(name, rows);
          console.log(`  refilled /services/${name}/ → ${rows.length} snapshot(s)`);
        }
        const updated: CdxCache = {
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

  console.log("Phase 1 — building snapshot index from Wayback CDX (13 queries)");
  const modernByMonth = new Map<string, CdxRow[]>();
  for (const [i, name] of MONTH_NAMES.entries()) {
    const rows = await cdxQueryModernMonth(name);
    modernByMonth.set(name, rows);
    console.log(`  [${i + 1}/13] modern /services/${name}/ → ${rows.length} snapshot(s)`);
    await sleep(CDX_SLEEP_MS);
  }
  const legacy = await cdxQuery(
    "http://www.ism.ws/ISMReport/NonMfgROB.cfm",
    "20140801",
    "20181231",
  );
  console.log(`  [13/13] legacy NonMfgROB.cfm → ${legacy.length} snapshot(s)`);

  const cache: CdxCache = {
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
