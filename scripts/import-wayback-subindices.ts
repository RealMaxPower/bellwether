/**
 * Extract the five ISM subindices from the same Wayback snapshots that
 * `import-wayback-ism.ts` already verified for the headline composite.
 *
 * Reads:  data/pmi-wayback.json (list of {date, value, sourceUrl} we trust)
 * Writes: data/pmi-subindices-wayback.json (one denormalized row per page)
 *
 * Each ISM Manufacturing Report on Business page contains five subindex
 * paragraphs alongside the headline. The phrasing varies — "registered N
 * percent" in the modern format, "(N percent)" in parenthetical asides, and
 * "registering N percent" after a "remained in {state} territory" clause —
 * but a single regex anchored on "{Subindex} Index ... N percent" handles
 * all three.
 *
 * Usage:
 *   npx tsx scripts/import-wayback-subindices.ts        # all months in pmi-wayback.json
 *   npx tsx scripts/import-wayback-subindices.ts 2024   # just rows whose date starts with 2024
 *   npm run import-wayback-subindices
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PAGE_SLEEP_MS = 2500;
const RETRY_DELAY_MS = 8000;
const MAX_RETRIES = 2;

const PMI_WAYBACK_PATH = resolve(process.cwd(), "data", "pmi-wayback.json");
const OUT_PATH = resolve(process.cwd(), "data", "pmi-subindices-wayback.json");

// Trailing `percent\b(?!age)` blocks "percentage" — without it we'd capture
// the X.X in "X.X percentage points lower than Y.Y percent" (a phrasing ISM
// started using in April 2023) instead of the actual value Y.Y. The lazy
// `[^.]{0,150}?` then naturally backtracks to the real number that's
// followed by a hard "percent\b" boundary.
/**
 * Two patterns, tried in order, because a page mentions each index several
 * times and only one of those mentions carries the month's actual value.
 *
 * STRICT matches ISM's canonical reporting phrasing, "{name} Index registered
 * N percent". Preferred because the looser pattern locks onto whichever
 * mention comes first, and that is often a summary or comparison sentence.
 * May 2026 had three "Supplier Deliveries Index" mentions; the second read
 * "stayed at its highest level since May 2022 (65.7 percent)", so the loose
 * pattern captured a 2022 historical reference instead of the 60.6 percent
 * reported two sentences later.
 *
 * LOOSE is the fallback for older pages that phrase it differently. Its
 * `(?:(?!Index)[^.])` is a tempered token — non-period characters that do not
 * begin another "... Index" mention. The period bound alone was not enough:
 * ISM packs several indices into one sentence, and March 2026 read "the
 * Supplier Deliveries Index indicated increasingly slowing deliveries, the
 * Inventories Index contracted at a faster rate, and the Prices Index took
 * another big leap - to 78.3 percent", so an anchor on Supplier Deliveries
 * skated past two other indices and captured the Prices value.
 *
 * Both failures stored a plausible-looking number under the wrong name. Only
 * the composite check in scripts/reconcile-ism.ts catches that, by requiring
 * the subindex mean to reproduce the headline.
 */
const SUB_RE_STRICT = (name: string) =>
  new RegExp(
    `${name}\\s*Index\\s+register(?:ed|ing)\\s+[^.0-9]{0,40}?(\\d{1,3}(?:\\.\\d)?)\\s*percent\\b(?!age)`,
    "i",
  );

/**
 * Some components are never "registered" — ISM writes "the reading of N
 * percent is X points lower than ...". Requires the definite article on
 * purpose: March 2026 also contained "dropped from February's reading of 59.9
 * percent to 53.9 percent", and matching a bare "reading of" would have taken
 * February's number.
 */
const SUB_RE_READING = (name: string) =>
  new RegExp(
    `${name}\\s*Index(?:(?!Index)[^.]){0,200}?\\bthe reading of (\\d{1,3}(?:\\.\\d)?)\\s*percent\\b(?!age)`,
    "i",
  );

const SUB_RE_LOOSE = (name: string) =>
  new RegExp(
    `${name}\\s*Index(?:(?!Index)[^.]){0,150}?(\\d{1,3}(?:\\.\\d)?)\\s*percent\\b(?!age)`,
    "i",
  );

function matchSubindex(name: string, html: string): RegExpExecArray | null {
  return (
    SUB_RE_STRICT(name).exec(html) ??
    SUB_RE_READING(name).exec(html) ??
    SUB_RE_LOOSE(name).exec(html)
  );
}

interface PmiRow {
  date: string;
  value: number;
  sourceUrl: string;
}

interface SubindexRow {
  date: string;
  composite: number;
  newOrders: number;
  production: number;
  employment: number;
  supplierDeliveries: number;
  inventories: number;
  sourceUrl: string;
}

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
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

function tryExtract(html: string, name: string): number | null {
  const m = matchSubindex(name, html);
  if (!m) return null;
  const v = Number(m[1]);
  if (!Number.isFinite(v) || v < 0 || v > 100) return null;
  return v;
}

async function main() {
  if (!existsSync(PMI_WAYBACK_PATH)) {
    console.error(
      `data/pmi-wayback.json not found. Run \`npm run import-wayback\` first.`,
    );
    process.exit(1);
  }
  const argv = process.argv.slice(2);
  const yearFilter = argv[0]; // optional "2024" → only those rows

  const pmi = JSON.parse(readFileSync(PMI_WAYBACK_PATH, "utf8")) as {
    observations: PmiRow[];
  };

  const existing = new Map<string, SubindexRow>();
  if (existsSync(OUT_PATH)) {
    try {
      const prev = JSON.parse(readFileSync(OUT_PATH, "utf8")) as {
        observations: SubindexRow[];
      };
      for (const r of prev.observations ?? []) existing.set(r.date, r);
    } catch {
      // Corrupt: rebuild.
    }
  }

  const targets = pmi.observations.filter(
    (o) => !existing.has(o.date) && (!yearFilter || o.date.startsWith(yearFilter)),
  );
  console.log(
    `Subindex extraction\n` +
      `  ${pmi.observations.length} composite rows in pmi-wayback.json\n` +
      `  ${existing.size} subindex rows already collected (will skip)\n` +
      `  ${targets.length} to process` +
      (yearFilter ? ` (filter: dates starting ${yearFilter})` : ""),
  );

  const collected: SubindexRow[] = Array.from(existing.values());
  const failures: { date: string; reason: string }[] = [];

  function flush() {
    collected.sort((a, b) => a.date.localeCompare(b.date));
    const today = new Date().toISOString().slice(0, 10);
    const out = {
      id: "PMI-SUBINDICES-WAYBACK",
      title:
        "ISM Manufacturing PMI Composite + 5 subindices (Wayback archive of primary releases)",
      source:
        "Wayback Machine archive of ISM monthly Manufacturing Report on Business pages — composite and the five subindices (New Orders, Production, Employment, Supplier Deliveries, Inventories) extracted from the same paragraphs",
      units: "Index",
      provenance: "wayback-archive",
      lastVerifiedAt: today,
      observations: collected,
    };
    writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`);
  }

  let done = 0;
  for (const pmiRow of targets) {
    done += 1;
    const res = await fetchWithRetry(pmiRow.sourceUrl);
    await sleep(PAGE_SLEEP_MS);
    if (!res || !res.ok) {
      failures.push({ date: pmiRow.date, reason: `fetch ${res?.status ?? "error"}` });
      console.log(
        `  [${done}/${targets.length}] ${pmiRow.date}  fetch ${res?.status ?? "error"}  ✗`,
      );
      continue;
    }
    const html = await res.text();
    const newOrders = tryExtract(html, "New Orders");
    const production = tryExtract(html, "Production");
    const employment = tryExtract(html, "Employment");
    const supplierDeliveries = tryExtract(html, "Supplier Deliveries");
    const inventories = tryExtract(html, "Inventories");
    const missing = [
      ["newOrders", newOrders],
      ["production", production],
      ["employment", employment],
      ["supplierDeliveries", supplierDeliveries],
      ["inventories", inventories],
    ].filter(([, v]) => v === null);
    if (missing.length > 0) {
      const names = missing.map(([n]) => n).join(",");
      failures.push({ date: pmiRow.date, reason: `missing: ${names}` });
      console.log(`  [${done}/${targets.length}] ${pmiRow.date}  missing ${names}  ✗`);
      continue;
    }
    const row: SubindexRow = {
      date: pmiRow.date,
      composite: pmiRow.value,
      newOrders: newOrders!,
      production: production!,
      employment: employment!,
      supplierDeliveries: supplierDeliveries!,
      inventories: inventories!,
      sourceUrl: pmiRow.sourceUrl,
    };
    collected.push(row);
    console.log(
      `  [${done}/${targets.length}] ${pmiRow.date}  N=${newOrders} P=${production} E=${employment} S=${supplierDeliveries} I=${inventories}  ✓`,
    );
    flush();
  }

  flush();
  const today = new Date().toISOString().slice(0, 10);
  console.log(
    `\nWrote ${collected.length} row(s) to data/pmi-subindices-wayback.json (verified ${today}).`,
  );
  if (failures.length > 0) {
    console.log(`\n${failures.length} month(s) failed:`);
    for (const f of failures) console.log(`  ${f.date}  ${f.reason}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
