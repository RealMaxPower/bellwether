/**
 * Backfill recent ISM PMI prints from PRNewswire press releases.
 *
 * ISM publishes every monthly Report on Business to PRNewswire on release
 * day. Their organization listing page chronologically links the last ~30
 * releases, and each headline-PMI release encodes the value in its URL slug:
 *
 *   manufacturing-pmi-at-52-7-april-2026-ism-manufacturing-pmi-report-...
 *                          ^value (52.7)  ^month + year
 *
 * The Wayback-based importers (import-wayback-ism.ts, import-wayback-nmi.ts)
 * lag ISM's live cadence by several months because the Wayback Machine
 * doesn't archive ismworld.org reliably. This script fills that lag.
 *
 * Output: appends new rows to data/pmi-curated.json and data/nmi-curated.json
 * (the merge in src/lib/data/series.ts treats hand-curated rows as winning
 * over Wayback on date overlap, so the homepage will pick up the latest
 * prints automatically).
 *
 * Optional verification: fetch each release page and confirm the headline
 * value in the body matches the slug. Skip with --no-verify for a fast
 * slug-only ingestion (defensible: ISM controls the slug template).
 *
 * Usage:
 *   npx tsx scripts/import-prnewswire-ism.ts
 *   npx tsx scripts/import-prnewswire-ism.ts --no-verify
 *   npm run import-prnewswire
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ARCHIVE_URL = "https://www.prnewswire.com/news/institute-for-supply-management/";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const FETCH_SLEEP_MS = 1500;
const PMI_CURATED_PATH = resolve(process.cwd(), "data", "pmi-curated.json");
const NMI_CURATED_PATH = resolve(process.cwd(), "data", "nmi-curated.json");

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

type Kind = "manufacturing" | "services";

interface Row {
  kind: Kind;
  date: string;
  value: number;
  sourceUrl: string;
}

interface CuratedFile {
  id: string;
  title: string;
  source: string;
  units: string;
  provenance: string;
  lastVerifiedAt: string;
  observations: Array<{ date: string; value: number; sourceUrl: string }>;
}

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.text();
}

function parseListing(html: string): Row[] {
  // ISM publishes Manufacturing PMI and Services PMI press releases. Each URL slug
  // has the form: {kind}-pmi-at-{value-slug}-{month}-{year}-ism-{kind}-pmi-report-{id}.html
  // where value-slug is the headline value with the decimal point replaced by '-'
  // ("52-7" for 52.7, "54" for 54.0).
  const re =
    /href="(\/news-releases\/(manufacturing|services)-pmi-at-([0-9]+(?:-[0-9])?)-(january|february|march|april|may|june|july|august|september|october|november|december)-(\d{4})-ism-(manufacturing|services)-pmi-report-\d+\.html)"/gi;
  const seen = new Set<string>();
  const rows: Row[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const [, path, kindRaw, valSlug, monthName, year] = m;
    const kind = kindRaw!.toLowerCase() as Kind;
    const monthIdx = MONTHS.indexOf(monthName!.toLowerCase() as (typeof MONTHS)[number]);
    if (monthIdx < 0) continue;
    const date = `${year}-${String(monthIdx + 1).padStart(2, "0")}-01`;
    const value = parseFloat(valSlug!.replace("-", "."));
    if (!Number.isFinite(value) || value < 20 || value > 80) continue;
    const key = `${kind}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      kind,
      date,
      value,
      sourceUrl: `https://www.prnewswire.com${path}`,
    });
  }
  return rows;
}

// The PRNewswire <title> always carries the canonical headline value:
//   "Manufacturing PMI® at 48.2%; November 2025 ISM® Manufacturing PMI® Report"
// This is more reliable than scanning the body, where the threshold value
// (e.g. "42.3 percent") and subindex tables can appear ahead of the headline.
const TITLE_VALUE_RE =
  /<title>\s*(?:Manufacturing|Services)\s+PMI(?:®|&reg;|&#174;|<\/?\w+>)*\s*at\s*(\d{2}(?:\.\d)?)\s*%/i;

async function verifyRow(row: Row): Promise<{ ok: boolean; titleValue?: number }> {
  const html = await fetchText(row.sourceUrl);
  const m = html.match(TITLE_VALUE_RE);
  if (!m) return { ok: false };
  const titleValue = parseFloat(m[1]!);
  if (!Number.isFinite(titleValue)) return { ok: false };
  return { ok: Math.abs(titleValue - row.value) < 0.05, titleValue };
}

function mergeIntoCurated(filePath: string, newRows: Row[]): { added: number; total: number } {
  const existing = JSON.parse(readFileSync(filePath, "utf8")) as CuratedFile;
  const byDate = new Map(existing.observations.map((o) => [o.date, o]));
  let added = 0;
  for (const row of newRows) {
    if (!byDate.has(row.date)) added += 1;
    byDate.set(row.date, {
      date: row.date,
      value: row.value,
      sourceUrl: row.sourceUrl,
    });
  }
  const observations = Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const out: CuratedFile = {
    ...existing,
    lastVerifiedAt: new Date().toISOString().slice(0, 10),
    observations,
  };
  writeFileSync(filePath, `${JSON.stringify(out, null, 2)}\n`);
  return { added, total: observations.length };
}

async function main() {
  const verify = !process.argv.includes("--no-verify");

  console.log(`Fetching ISM listing from ${ARCHIVE_URL}`);
  const listingHtml = await fetchText(ARCHIVE_URL);
  const rows = parseListing(listingHtml);
  if (rows.length === 0) {
    console.error("Found 0 release URLs in the listing. Selector may be stale.");
    process.exit(1);
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`Parsed ${rows.length} release(s) from listing.`);

  if (verify) {
    console.log("Verifying each release against its press-release body...");
    const failures: Row[] = [];
    for (const row of rows) {
      await sleep(FETCH_SLEEP_MS);
      try {
        const { ok, titleValue } = await verifyRow(row);
        if (!ok) {
          console.warn(
            `  ✗ ${row.kind} ${row.date} — slug says ${row.value}, title has ${titleValue ?? "no match"}`,
          );
          failures.push(row);
        } else {
          console.log(`  ✓ ${row.kind} ${row.date}  ${row.value}`);
        }
      } catch (err) {
        console.warn(`  ! ${row.kind} ${row.date} — fetch failed: ${(err as Error).message}`);
        failures.push(row);
      }
    }
    if (failures.length > 0) {
      console.log(`Dropping ${failures.length} unverified row(s) from this run.`);
    }
    const failedKeys = new Set(failures.map((r) => `${r.kind}|${r.date}`));
    const verified = rows.filter((r) => !failedKeys.has(`${r.kind}|${r.date}`));
    return finalize(verified);
  }
  return finalize(rows);
}

function finalize(rows: Row[]) {
  const mfg = rows.filter((r) => r.kind === "manufacturing");
  const svc = rows.filter((r) => r.kind === "services");

  if (mfg.length > 0) {
    const { added, total } = mergeIntoCurated(PMI_CURATED_PATH, mfg);
    console.log(
      `data/pmi-curated.json: +${added} new month(s); ${total} total observation(s).`,
    );
  }
  if (svc.length > 0) {
    const { added, total } = mergeIntoCurated(NMI_CURATED_PATH, svc);
    console.log(
      `data/nmi-curated.json: +${added} new month(s); ${total} total observation(s).`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
