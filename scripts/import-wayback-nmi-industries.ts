/**
 * Extract per-month industry-level growth/contraction lists from Wayback ISM
 * Services ROB pages. Parallel to `import-wayback-industries.ts` for
 * Manufacturing — used to upgrade the 18 Pandemic-regime cells in the
 * Services heatmap from scaffold-placeholder to primary-source.
 *
 * Reads:  data/nmi-wayback.json (URL list)
 *         data/sectors-services.json (the canonical 18 services industries)
 * Writes: data/services-industry-monthly-wayback.json
 *
 * Strategy mirrors the Mfg version, with two material differences:
 *   1. Regex accepts "services industries" / "non-manufacturing industries"
 *      / "NMI industries" in addition to the bare "industries" form.
 *   2. The 18-industry vocabulary is the Services panel (Construction,
 *      Health Care, Real Estate, etc.) rather than the Mfg panel.
 *
 * Usage:
 *   npx tsx scripts/import-wayback-nmi-industries.ts
 *   npm run import-wayback-nmi-industries
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PAGE_SLEEP_MS = 2500;
const RETRY_DELAY_MS = 8000;
const MAX_RETRIES = 2;

const NMI_WAYBACK_PATH = resolve(process.cwd(), "data", "nmi-wayback.json");
const SECTORS_SERVICES_PATH = resolve(process.cwd(), "data", "sectors-services.json");
const OUT_PATH = resolve(
  process.cwd(),
  "data",
  "services-industry-monthly-wayback.json",
);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface NmiRow {
  date: string;
  value: number;
  sourceUrl: string;
}

interface IndustryRow {
  date: string;
  growing: string[];
  contracting: string[];
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

function clean(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, " ");
}

/**
 * Build a normalizer for ISM Services industry names. ISM uses NAICS-derived
 * names that are sometimes longer than necessary ("Health Care &
 * Social Assistance"); the canonical names in sectors-services.json are
 * already in their authoritative ISM form, so direct match works for most
 * inputs and prefix-match catches any verbose-suffix outliers.
 */
function makeNormalizer(canonical: string[]): (raw: string) => string | null {
  const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const canonByKey = new Map(canonical.map((c) => [key(c), c]));
  // Common ISM verbosity → canonical aliases.
  const aliases: Record<string, string> = {
    accommodationfoodservices: "Accommodation & Food Services",
    artsentertainmentrecreation: "Arts, Entertainment & Recreation",
    healthcaresocialassistance: "Health Care & Social Assistance",
    professionalscientifictechnicalservices:
      "Professional, Scientific & Technical Services",
    realestatentaleasing: "Real Estate, Rental & Leasing",
    realestatentalleasing: "Real Estate, Rental & Leasing",
    transportationwarehousing: "Transportation & Warehousing",
    managementofcompaniessupportservices:
      "Management of Companies & Support Services",
    agricultureforestryfishinghunting: "Agriculture, Forestry, Fishing & Hunting",
  };
  for (const [k, v] of Object.entries(aliases)) canonByKey.set(k, v);
  return (raw: string) => {
    const k = key(raw);
    if (canonByKey.has(k)) return canonByKey.get(k)!;
    for (const [ck, cv] of canonByKey) {
      if (k.startsWith(ck) || ck.startsWith(k)) return cv;
    }
    return null;
  };
}

function extractOverallLists(
  text: string,
  monthName: string,
  normalize: (raw: string) => string | null,
): { growing: string[]; contracting: string[]; unknown: string[] } {
  const monthRe = monthName;

  // Patterns we've seen across page eras (Services ROB phrasing):
  //   "industries reporting growth in {Month} are: …"
  //   "non-manufacturing industries reporting growth in {Month}, in order: …"
  //   "services industries reporting growth in {Month} are: …"
  //   "the X services industries reporting growth in {Month}, in order, are: …"
  // The crucial constraint: NO subindex name between "in" and "{Month}". The
  // boilerplate-peeling regex is identical to the Mfg version with extra
  // qualifier alternations.
  const overallRe = (verb: string) =>
    new RegExp(
      `(?:industries|services\\s+industries|non-manufacturing\\s+industries|nmi\\s+industries)(?:[^.]{0,80}?)?(?:reporting|reported|that\\s+reported)\\s+(?:a\\s+)?` +
        verb +
        `\\s+in\\s+${monthRe}\\b[^:]{0,120}?(?::|\\bare\\b)\\s*([A-Z][^.]+?)(?:\\.|$)`,
      "i",
    );

  const out = { growing: [] as string[], contracting: [] as string[], unknown: [] as string[] };

  for (const [verb, side] of [
    ["growth", "growing"],
    ["contraction", "contracting"],
    ["a\\s+decrease", "contracting"],
  ] as const) {
    const re = overallRe(verb);
    const m = re.exec(text);
    if (!m) continue;
    const list = m[1]!.trim();
    const items = list
      .split(/;|,\s+and\s+|\s+and\s+(?=[A-Z])/)
      .map((s) => s.replace(/^\s*and\s+/i, "").trim())
      .filter((s) => s.length > 0);
    for (const raw of items) {
      const canon = normalize(raw);
      if (canon) {
        if (!out[side as "growing" | "contracting"].includes(canon)) {
          out[side as "growing" | "contracting"].push(canon);
        }
      } else {
        out.unknown.push(raw);
      }
    }
  }

  return out;
}

async function main() {
  if (!existsSync(NMI_WAYBACK_PATH)) {
    console.error(`data/nmi-wayback.json missing — run npm run import-wayback-nmi first.`);
    process.exit(1);
  }
  const nmi = JSON.parse(readFileSync(NMI_WAYBACK_PATH, "utf8")) as {
    provenance?: string;
    observations: NmiRow[];
  };
  if (nmi.provenance === "synthetic") {
    console.error(
      `data/nmi-wayback.json is still synthetic — run npm run import-wayback-nmi first.`,
    );
    process.exit(1);
  }
  const sectorsServices = JSON.parse(readFileSync(SECTORS_SERVICES_PATH, "utf8")) as {
    industries: string[];
  };
  const normalize = makeNormalizer(sectorsServices.industries);

  const existing = new Map<string, IndustryRow>();
  if (existsSync(OUT_PATH)) {
    try {
      const prev = JSON.parse(readFileSync(OUT_PATH, "utf8")) as {
        observations: IndustryRow[];
      };
      for (const r of prev.observations ?? []) existing.set(r.date, r);
    } catch {
      // rebuild
    }
  }

  const targets = nmi.observations.filter((o) => !existing.has(o.date));
  console.log(
    `${nmi.observations.length} Services composite rows · ${existing.size} cached · ${targets.length} to fetch`,
  );

  const collected: IndustryRow[] = Array.from(existing.values());
  const failures: { date: string; reason: string }[] = [];
  const allUnknownNames = new Map<string, number>();

  function flush() {
    collected.sort((a, b) => a.date.localeCompare(b.date));
    const out = {
      id: "SERVICES-INDUSTRY-MONTHLY-WAYBACK",
      title:
        "ISM Services — per-month industry growth/contraction lists (Wayback archive)",
      source:
        "Wayback Machine archive of ISM monthly Services Report on Business pages — overall NMI / Services PMI growth/contraction lists, normalized against the 18-industry canonical names from data/sectors-services.json",
      provenance: "wayback-archive",
      lastVerifiedAt: new Date().toISOString().slice(0, 10),
      industries: sectorsServices.industries,
      observations: collected,
    };
    writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`);
  }

  let done = 0;
  for (const nmiRow of targets) {
    done += 1;
    const monthIdx = Number(nmiRow.date.slice(5, 7)) - 1;
    const monthName = MONTH_NAMES[monthIdx]!;
    const res = await fetchWithRetry(nmiRow.sourceUrl);
    await sleep(PAGE_SLEEP_MS);
    if (!res || !res.ok) {
      failures.push({ date: nmiRow.date, reason: `fetch ${res?.status ?? "error"}` });
      console.log(`  [${done}/${targets.length}] ${nmiRow.date}  fetch failed`);
      continue;
    }
    const text = clean(await res.text());
    const result = extractOverallLists(text, monthName, normalize);
    if (result.growing.length === 0 && result.contracting.length === 0) {
      failures.push({ date: nmiRow.date, reason: "no overall lists matched" });
      console.log(`  [${done}/${targets.length}] ${nmiRow.date}  ✗ no lists`);
      continue;
    }
    const row: IndustryRow = {
      date: nmiRow.date,
      growing: result.growing,
      contracting: result.contracting,
      sourceUrl: nmiRow.sourceUrl,
    };
    collected.push(row);
    for (const u of result.unknown) {
      allUnknownNames.set(u, (allUnknownNames.get(u) ?? 0) + 1);
    }
    console.log(
      `  [${done}/${targets.length}] ${nmiRow.date}  +${row.growing.length} grow / -${row.contracting.length} contract` +
        (result.unknown.length > 0 ? `  (${result.unknown.length} unmatched name${result.unknown.length === 1 ? "" : "s"})` : "") +
        `  ✓`,
    );
    flush();
  }

  flush();
  console.log(
    `\nWrote ${collected.length} row(s) to data/services-industry-monthly-wayback.json.`,
  );
  if (failures.length > 0) {
    console.log(`\n${failures.length} month(s) failed:`);
    for (const f of failures) console.log(`  ${f.date}  ${f.reason}`);
  }
  if (allUnknownNames.size > 0) {
    console.log(
      `\n${allUnknownNames.size} unmatched industry name(s) across the run — extend the alias map in makeNormalizer():`,
    );
    const sorted = Array.from(allUnknownNames.entries()).sort((a, b) => b[1] - a[1]);
    for (const [name, count] of sorted) console.log(`  ${count}× "${name}"`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
