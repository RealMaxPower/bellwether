/**
 * Extract the four headline ISM Services subindices (Business Activity,
 * New Orders, Employment, Supplier Deliveries) from the same Wayback
 * snapshots that `import-wayback-nmi.ts` already verified for the headline.
 *
 * Reads:  data/nmi-wayback.json (list of {date, value, sourceUrl} we trust)
 * Writes: data/nmi-subindices-wayback.json (one denormalized row per page)
 *
 * Mirrors `import-wayback-subindices.ts` for Manufacturing. The regex
 * targets are different (Services has Business Activity instead of
 * Production, and only four headline subindices instead of five — Inventories
 * is reported in Services but not in the headline composite).
 *
 * Usage:
 *   npx tsx scripts/import-wayback-nmi-subindices.ts        # all months
 *   npx tsx scripts/import-wayback-nmi-subindices.ts 2024   # filter by year
 *   npm run import-wayback-nmi-subindices
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PAGE_SLEEP_MS = 2500;
const RETRY_DELAY_MS = 8000;
const MAX_RETRIES = 2;

const NMI_WAYBACK_PATH = resolve(process.cwd(), "data", "nmi-wayback.json");
const OUT_PATH = resolve(process.cwd(), "data", "nmi-subindices-wayback.json");

const SUB_RE = (name: string) =>
  new RegExp(
    `${name}\\s*Index[^.]{0,150}?(\\d{1,3}(?:\\.\\d)?)\\s*percent\\b(?!age)`,
    "i",
  );

interface NmiRow {
  date: string;
  value: number;
  sourceUrl: string;
}

interface SubindexRow {
  date: string;
  composite: number;
  businessActivity: number;
  newOrders: number;
  employment: number;
  supplierDeliveries: number;
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
  const m = SUB_RE(name).exec(html);
  if (!m) return null;
  const v = Number(m[1]);
  if (!Number.isFinite(v) || v < 0 || v > 100) return null;
  return v;
}

async function main() {
  if (!existsSync(NMI_WAYBACK_PATH)) {
    console.error(
      `data/nmi-wayback.json not found. Run \`npm run import-wayback-nmi\` first.`,
    );
    process.exit(1);
  }
  const argv = process.argv.slice(2);
  const yearFilter = argv[0];

  const nmi = JSON.parse(readFileSync(NMI_WAYBACK_PATH, "utf8")) as {
    provenance?: string;
    observations: NmiRow[];
  };
  if (nmi.provenance === "synthetic") {
    console.error(
      `data/nmi-wayback.json is still synthetic — run \`npm run import-wayback-nmi\` first to populate real values.`,
    );
    process.exit(1);
  }

  const existing = new Map<string, SubindexRow>();
  if (existsSync(OUT_PATH)) {
    try {
      const prev = JSON.parse(readFileSync(OUT_PATH, "utf8")) as {
        provenance?: string;
        observations: SubindexRow[];
      };
      if (prev.provenance !== "synthetic") {
        for (const r of prev.observations ?? []) existing.set(r.date, r);
      }
    } catch {
      // Corrupt: rebuild.
    }
  }

  const targets = nmi.observations.filter(
    (o) => !existing.has(o.date) && (!yearFilter || o.date.startsWith(yearFilter)),
  );
  console.log(
    `Services subindex extraction\n` +
      `  ${nmi.observations.length} composite rows in nmi-wayback.json\n` +
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
      id: "NMI-SUBINDICES-WAYBACK",
      title:
        "ISM Services PMI Composite + 4 headline subindices (Wayback archive of primary releases)",
      source:
        "Wayback Machine archive of ISM monthly Services Report on Business pages — composite and the four headline subindices (Business Activity, New Orders, Employment, Supplier Deliveries) extracted from the same paragraphs",
      units: "Index",
      provenance: "wayback-archive",
      lastVerifiedAt: today,
      observations: collected,
    };
    writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`);
  }

  let done = 0;
  for (const nmiRow of targets) {
    done += 1;
    const res = await fetchWithRetry(nmiRow.sourceUrl);
    await sleep(PAGE_SLEEP_MS);
    if (!res || !res.ok) {
      failures.push({ date: nmiRow.date, reason: `fetch ${res?.status ?? "error"}` });
      console.log(
        `  [${done}/${targets.length}] ${nmiRow.date}  fetch ${res?.status ?? "error"}  ✗`,
      );
      continue;
    }
    const html = await res.text();
    const businessActivity = tryExtract(html, "Business Activity");
    const newOrders = tryExtract(html, "New Orders");
    const employment = tryExtract(html, "Employment");
    const supplierDeliveries = tryExtract(html, "Supplier Deliveries");
    const missing = [
      ["businessActivity", businessActivity],
      ["newOrders", newOrders],
      ["employment", employment],
      ["supplierDeliveries", supplierDeliveries],
    ].filter(([, v]) => v === null);
    if (missing.length > 0) {
      const names = missing.map(([n]) => n).join(",");
      failures.push({ date: nmiRow.date, reason: `missing: ${names}` });
      console.log(`  [${done}/${targets.length}] ${nmiRow.date}  missing ${names}  ✗`);
      continue;
    }
    const row: SubindexRow = {
      date: nmiRow.date,
      composite: nmiRow.value,
      businessActivity: businessActivity!,
      newOrders: newOrders!,
      employment: employment!,
      supplierDeliveries: supplierDeliveries!,
      sourceUrl: nmiRow.sourceUrl,
    };
    collected.push(row);
    console.log(
      `  [${done}/${targets.length}] ${nmiRow.date}  BA=${businessActivity} NO=${newOrders} E=${employment} SD=${supplierDeliveries}  ✓`,
    );
    flush();
  }

  flush();
  const today = new Date().toISOString().slice(0, 10);
  console.log(
    `\nWrote ${collected.length} row(s) to data/nmi-subindices-wayback.json (verified ${today}).`,
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
