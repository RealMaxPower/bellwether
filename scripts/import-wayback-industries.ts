/**
 * Extract per-month industry-level growth/contraction lists from the same
 * Wayback ISM ROB pages we already verified. Used to upgrade the 18
 * Pandemic-regime cells in the heatmap from hand-estimate to primary-source.
 *
 * Reads:  data/pmi-wayback.json (URL list)
 *         data/sectors.json     (the canonical 18-industry vocabulary)
 * Writes: data/industry-monthly-wayback.json
 *
 * Strategy:
 *   ISM pages list industries growing or contracting for the headline PMI
 *   ("industries reporting growth in {Month}: A; B; C…") and again for each
 *   subindex ("growth in new orders in {Month}: …"). We want the OVERALL/PMI
 *   list, distinguished by having nothing between "growth in" and the month
 *   name (subindex lists insert "{subindex} in" between them).
 *
 *   Phrasing varies year-over-year; the regex tries multiple known shapes
 *   and reports any month that yielded zero industries on either side so we
 *   can hand-fix outliers.
 *
 * Usage:
 *   npx tsx scripts/import-wayback-industries.ts
 *   npm run import-wayback-industries
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PAGE_SLEEP_MS = 2500;
const RETRY_DELAY_MS = 8000;
const MAX_RETRIES = 2;

const PMI_WAYBACK_PATH = resolve(process.cwd(), "data", "pmi-wayback.json");
const SECTORS_PATH = resolve(process.cwd(), "data", "sectors.json");
const OUT_PATH = resolve(process.cwd(), "data", "industry-monthly-wayback.json");

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface PmiRow {
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

/**
 * Strip HTML tags and decode the entities ISM actually uses, leaving plain
 * text we can regex against. Collapses whitespace.
 */
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
 * Build a normalizer: maps ISM's looser names ("Food, Beverage & Tobacco
 * Products") to the canonical names in sectors.json ("Food, Beverage &
 * Tobacco"). Returns null if no match — the caller logs unmatched names
 * so we can extend the alias map.
 */
function makeNormalizer(canonical: string[]): (raw: string) => string | null {
  // Pre-compute a "loose key" for each canonical name: lowercase, ASCII,
  // strip punctuation/spaces. Match raw inputs against these by prefix.
  const key = (s: string) =>
    s.toLowerCase().replace(/[^a-z]/g, "");
  const canonByKey = new Map(canonical.map((c) => [key(c), c]));
  // Add common ISM verbosity → canonical aliases.
  const aliases: Record<string, string> = {
    "foodbeveragetobaccoproducts": "Food, Beverage & Tobacco",
    "apparelleatherandalliedproducts": "Apparel, Leather & Allied Products",
  };
  for (const [k, v] of Object.entries(aliases)) canonByKey.set(k, v);
  return (raw: string) => {
    const k = key(raw);
    if (canonByKey.has(k)) return canonByKey.get(k)!;
    // Fallback: prefix match — sometimes ISM appends or trims words.
    for (const [ck, cv] of canonByKey) {
      if (k.startsWith(ck) || ck.startsWith(k)) return cv;
    }
    return null;
  };
}

/**
 * Pull the OVERALL (headline-PMI) growth and contraction lists out of one
 * page's plain text. Returns the list of industries on each side, in the
 * order ISM wrote them.
 */
function extractOverallLists(
  text: string,
  monthName: string,
  normalize: (raw: string) => string | null,
): { growing: string[]; contracting: string[]; unknown: string[] } {
  const monthRe = monthName;

  // Patterns we've seen across page eras:
  //   "industries reporting growth in {Month} in (the following )?order are: …"
  //   "industries reported growth in {Month}, in the following order: …"
  //   "industries that reported growth in {Month} are: …"
  //   "industries reporting growth in {Month} — in order — are: …"
  //   "manufacturing industries, X are reporting growth in {Month} in the following order: …"
  //   "the only industry reporting contraction in {Month} is X."
  // The crucial constraint: NO subindex name between "in" and "{Month}" —
  // that is what stops "reporting a decrease in new orders in {Month}" being
  // read as the overall list. Only the fixed qualifier "the month of" may
  // sit in that slot. The `(?:in (?:the )?(?:following )?order|—|are)` block
  // lets us peel off the boilerplate that varies year over year.
  const NOUN = "(?:industries|industry|manufacturing\\s+industries)";
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
  //   "The only industry reporting contraction in May is Wood Products."
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
    // Each item is separated by ";"; the last is preceded by "; and".
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
  // alone. Under a "Production" heading ISM drops the subindex name from the
  // second sentence — "The eight industries reporting a decrease in May, in
  // the following order, are: …" — which satisfies every month-anchored
  // pattern here. Position separates them cleanly: measured on real pages, a
  // genuine overall contraction list begins 10-11 characters after the
  // overall growth list ends (it is the very next sentence), while that
  // Production list sits ~9,300 characters away under its own heading.
  const MAX_GAP_FROM_GROWTH = 600;
  const growthEnd = growth ? growth.index + growth[0].length : null;
  const nearGrowth = (m: RegExpExecArray | null) =>
    m && (growthEnd === null || Math.abs(m.index - growthEnd) <= MAX_GAP_FROM_GROWTH) ? m : null;

  // First match wins. These are alternative phrasings of the SAME overall
  // list across page eras, not separate lists to be concatenated: "a
  // decrease" is the pre-2015 wording of "contraction". Running them all and
  // appending is how a handful of months ended up listing an industry as
  // both growing and contracting.
  const contraction =
    nearGrowth(match("contraction")) ??
    nearGrowth(match("a\\s+decrease")) ??
    nearGrowth(verblessContractionRe.exec(text));
  if (contraction) absorb(contraction[1]!, "contracting");

  return out;
}

async function main() {
  if (!existsSync(PMI_WAYBACK_PATH)) {
    console.error(`data/pmi-wayback.json missing — run npm run import-wayback first.`);
    process.exit(1);
  }
  const pmi = JSON.parse(readFileSync(PMI_WAYBACK_PATH, "utf8")) as {
    observations: PmiRow[];
  };
  const sectors = JSON.parse(readFileSync(SECTORS_PATH, "utf8")) as {
    industries: string[];
  };
  const normalize = makeNormalizer(sectors.industries);

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

  // Only need Pandemic-regime months for the heatmap fix (>= 2019-12).
  // We process everything in pmi-wayback.json so re-running with a wider
  // regime later is cheap.
  const targets = pmi.observations.filter((o) => !existing.has(o.date));
  console.log(
    `${pmi.observations.length} composite rows · ${existing.size} cached · ${targets.length} to fetch`,
  );

  const collected: IndustryRow[] = Array.from(existing.values());
  const failures: { date: string; reason: string }[] = [];
  const allUnknownNames = new Map<string, number>();
  // Months where the growth list parsed but the contraction list came back
  // empty. A genuinely zero month is possible in a strong expansion, so one
  // of these is not an error — but ISM changing its contraction phrasing
  // shows up as *every* month going empty, silently. See the regression
  // check after the loop.
  const noContraction: string[] = [];

  function flush() {
    collected.sort((a, b) => a.date.localeCompare(b.date));
    const out = {
      id: "INDUSTRY-MONTHLY-WAYBACK",
      title:
        "ISM Manufacturing — per-month industry growth/contraction lists (Wayback archive)",
      source:
        "Wayback Machine archive of ISM monthly Manufacturing Report on Business pages — overall PMI growth/contraction lists, normalized against the 18-industry canonical names from data/sectors.json",
      provenance: "wayback-archive",
      lastVerifiedAt: new Date().toISOString().slice(0, 10),
      industries: sectors.industries,
      observations: collected,
    };
    writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`);
  }

  let done = 0;
  for (const pmiRow of targets) {
    done += 1;
    const monthIdx = Number(pmiRow.date.slice(5, 7)) - 1;
    const monthName = MONTH_NAMES[monthIdx]!;
    const res = await fetchWithRetry(pmiRow.sourceUrl);
    await sleep(PAGE_SLEEP_MS);
    if (!res || !res.ok) {
      failures.push({ date: pmiRow.date, reason: `fetch ${res?.status ?? "error"}` });
      console.log(`  [${done}/${targets.length}] ${pmiRow.date}  fetch failed`);
      continue;
    }
    const text = clean(await res.text());
    const result = extractOverallLists(text, monthName, normalize);
    if (result.growing.length === 0 && result.contracting.length === 0) {
      failures.push({ date: pmiRow.date, reason: "no overall lists matched" });
      console.log(`  [${done}/${targets.length}] ${pmiRow.date}  ✗ no lists`);
      continue;
    }
    const row: IndustryRow = {
      date: pmiRow.date,
      growing: result.growing,
      contracting: result.contracting,
      sourceUrl: pmiRow.sourceUrl,
    };
    if (row.contracting.length === 0) noContraction.push(row.date);
    collected.push(row);
    for (const u of result.unknown) {
      allUnknownNames.set(u, (allUnknownNames.get(u) ?? 0) + 1);
    }
    console.log(
      `  [${done}/${targets.length}] ${pmiRow.date}  +${row.growing.length} grow / -${row.contracting.length} contract` +
        (result.unknown.length > 0 ? `  (${result.unknown.length} unmatched name${result.unknown.length === 1 ? "" : "s"})` : "") +
        `  ✓`,
    );
    flush();
  }

  flush();
  console.log(`\nWrote ${collected.length} row(s) to data/industry-monthly-wayback.json.`);
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
