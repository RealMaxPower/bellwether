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
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "'")
    // Decode &amp; last so we never double-unescape (e.g. &amp;lt; -> &lt;).
    .replace(/&amp;/g, "&")
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
  //   "the X industries reporting a contraction in the month of {Month} are: …"
  //   "the only industry reporting a contraction in the month of {Month} is X."
  // The crucial constraint: NO subindex name between "in" and "{Month}" —
  // that is what stops "reporting a decrease in business activity in the
  // month of {Month}" being read as the overall list. Only the fixed
  // qualifier "the month of" may sit in that slot; anything else still fails
  // to match, by design.
  const NOUN =
    "(?:industries|industry|services\\s+industries|non-manufacturing\\s+industries|nmi\\s+industries)";
  const IN_MONTH = `\\s+in\\s+(?:the\\s+month\\s+of\\s+)?${monthRe}\\b`;
  // The lead-in between "{Month}" and the list ("— listed in order —",
  // ", in the following order,") must stay inside one sentence: excluding
  // "." as well as ":" stops a short list sentence from running on into the
  // next one, where "WHAT RESPONDENTS ARE SAYING" offers a case-insensitive
  // `are` and the capture swallows a respondent quote.
  const LIST = `[^.:]{0,120}?(?::|\\bare\\b)\\s*([A-Z][^.]+?)(?:\\.|$)`;

  const overallRe = (verb: string) =>
    new RegExp(
      `${NOUN}(?:[^.]{0,80}?)?(?:reporting|reported|that\\s+reported)\\s+(?:a\\s+)?` +
        verb +
        IN_MONTH +
        LIST,
      "i",
    );

  // A one-industry month is written without a colon or "are":
  //   "The only industry reporting a contraction in the month of May is
  //    Real Estate, Rental & Leasing."
  // `is` deliberately does NOT join the delimiter alternation above: on a
  // plural sentence it fires on the first stray "is" in the lead-in prose
  // and captures that instead of the list. Requiring the singular "only
  // industry" keeps it from ever competing with a real list.
  const singularRe = (verb: string) =>
    new RegExp(
      `\\bonly\\s+industry\\s+(?:reporting|reported|that\\s+reported)\\s+(?:a\\s+)?` +
        verb +
        IN_MONTH +
        `\\s+is\\s+([A-Z][^.]+?)(?:\\.|$)`,
      "i",
    );

  // 2026 pages introduced a verbless form carrying no month token at all:
  //   "The three industries in contraction are: A; B; C."
  // It cannot be anchored on the month, so it is a fallback used only when
  // the month-anchored patterns found no contraction. "industries reporting
  // contraction or decreases" (the trailing methodology boilerplate) does
  // not match — it has no "in" before "contraction".
  const verblessContractionRe = new RegExp(
    `${NOUN}\\s+in\\s+contraction\\s+(?:are|is)\\s*:?\\s*([A-Z][^.]+?)(?:\\.|$)`,
    "i",
  );

  const out = { growing: [] as string[], contracting: [] as string[], unknown: [] as string[] };

  function absorb(list: string, side: "growing" | "contracting") {
    const items = list
      .trim()
      .split(/;|,\s+and\s+|\s+and\s+(?=[A-Z])/)
      .map((s) => s.replace(/^\s*and\s+/i, "").trim())
      .filter((s) => s.length > 0);
    for (const raw of items) {
      const canon = normalize(raw);
      if (canon) {
        if (!out[side].includes(canon)) out[side].push(canon);
      } else {
        out.unknown.push(raw);
      }
    }
  }

  const match = (verb: string) => overallRe(verb).exec(text) ?? singularRe(verb).exec(text);

  const growth = match("growth");
  if (growth) absorb(growth[1]!, "growing");

  // Some subindex lists cannot be told from the overall list by wording
  // alone. Under a subindex heading ISM drops the subindex name from the
  // second sentence — "The eight industries reporting a decrease in May, in
  // the following order, are: …" — which satisfies every month-anchored
  // pattern here. Position separates them cleanly: measured on real pages, a
  // genuine overall contraction list begins 10-11 characters after the
  // overall growth list ends (it is the very next sentence), while a
  // subindex list sits thousands of characters away under its own heading.
  const MAX_GAP_FROM_GROWTH = 600;
  const growthEnd = growth ? growth.index + growth[0].length : null;
  const nearGrowth = (m: RegExpExecArray | null) =>
    m && (growthEnd === null || Math.abs(m.index - growthEnd) <= MAX_GAP_FROM_GROWTH) ? m : null;

  // First match wins. These are alternative phrasings of the SAME overall
  // list across page eras, not separate lists to be concatenated: "a
  // decrease" is the pre-2015 wording of "contraction". Running them all and
  // appending is how eight months between 2020-08 and 2021-12 ended up
  // listing an industry as both growing and contracting.
  const contraction =
    nearGrowth(match("contraction")) ??
    nearGrowth(match("a\\s+decrease")) ??
    nearGrowth(verblessContractionRe.exec(text));
  if (contraction) absorb(contraction[1]!, "contracting");

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

  // Cached rows are reused as-is, which is what makes the monthly run cheap.
  // That also means a parser fix reaches only months fetched *after* it:
  // --rebuild-from=YYYY-MM-DD drops cached rows from that month on so they
  // are re-extracted, and --rebuild drops all of them.
  const rebuildFromArg = process.argv.find((a) => a.startsWith("--rebuild-from="));
  const rebuildFrom = process.argv.includes("--rebuild")
    ? "0000-00-00"
    : rebuildFromArg?.slice("--rebuild-from=".length);

  const existing = new Map<string, IndustryRow>();
  if (existsSync(OUT_PATH)) {
    try {
      const prev = JSON.parse(readFileSync(OUT_PATH, "utf8")) as {
        observations: IndustryRow[];
      };
      for (const r of prev.observations ?? []) {
        if (rebuildFrom && r.date >= rebuildFrom) continue;
        existing.set(r.date, r);
      }
    } catch {
      // rebuild
    }
  }
  if (rebuildFrom) {
    console.log(`Rebuilding rows dated >= ${rebuildFrom} (cached rows before it are kept).`);
  }

  const targets = nmi.observations.filter((o) => !existing.has(o.date));
  console.log(
    `${nmi.observations.length} Services composite rows · ${existing.size} cached · ${targets.length} to fetch`,
  );

  const collected: IndustryRow[] = Array.from(existing.values());
  const failures: { date: string; reason: string }[] = [];
  const allUnknownNames = new Map<string, number>();
  // Months where the growth list parsed but the contraction list came back
  // empty. A genuinely zero month is possible in a strong expansion, so one
  // of these is not an error — but ISM changing its contraction phrasing
  // shows up as *every* month going empty, which is how this went unnoticed
  // from 2022-03 to 2026-09. See the regression check after the loop.
  const noContraction: string[] = [];

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
    if (row.contracting.length === 0) noContraction.push(row.date);
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

  if (noContraction.length > 0) {
    console.log(
      `\n${noContraction.length} of ${targets.length - failures.length} parsed month(s) listed no contracting industries:`,
    );
    console.log(`  ${noContraction.join(", ")}`);
  }
  // The heatmap scores growth *share* — g/(g+c) — so a contraction list that
  // silently stops parsing does not blank the panel, it pins every cell
  // toward +100. Nothing downstream can tell that apart from a real boom, so
  // the assertion has to live here: if a whole multi-month run found not one
  // contracting industry, ISM has changed its phrasing again.
  const parsed = targets.length - failures.length;
  if (parsed >= 3 && noContraction.length === parsed) {
    console.error(
      `\nERROR: all ${parsed} parsed month(s) came back with zero contracting industries.\n` +
        `That is a phrasing regression, not an economy where nothing ever contracts.\n` +
        `Compare a source page against the patterns in extractOverallLists().`,
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
