import Link from "next/link";
import { GlossaryTerm } from "@/components/ui/glossary-term";
import { loadSectors, sectorProvenanceLabels } from "@/lib/data/sectors";
import {
  getAllSubindices,
  getCuratedNMI,
  getCuratedPMI,
  getFedFunds,
  getHistoricalPMI,
  getINDPRO,
  getIPMAN,
  getPMI,
  getRecessions,
  getWaybackNMI,
  getWaybackNMISubindices,
  getWaybackPMI,
  getWaybackSubindices,
} from "@/lib/data/series";
import { provenanceLabels, type MonthlySeries } from "@/lib/data/schemas";
import { loadPolicies } from "@/lib/content/load-policies";
import industryMonthlyRaw from "../../../data/industry-monthly-wayback.json";

export const metadata = {
  title: "About the data — Bellwether",
  description:
    "Where every number on this site comes from, when it was last verified, and the known caveats.",
};

function summarize(series: MonthlySeries) {
  const last = series.observations.at(-1);
  return {
    title: series.title,
    provenance: series.provenance,
    lastVerifiedAt: series.lastVerifiedAt,
    latestObservation: last?.date ?? "—",
    latestValue: last?.value ?? null,
    n: series.observations.length,
  };
}

export default function AboutTheDataPage() {
  const indpro = summarize(getINDPRO());
  const ipman = summarize(getIPMAN());
  const pmi = summarize(getPMI());
  const curatedPmi = getCuratedPMI();
  const historicalPmi = getHistoricalPMI();
  const waybackPmi = getWaybackPMI();
  const fedFunds = summarize(getFedFunds());
  const subs = getAllSubindices();
  const subSummaries = Object.entries(subs).map(([k, s]) => ({ key: k, ...summarize(s) }));
  const waybackSubs = getWaybackSubindices();
  const waybackSubsAny = Object.values(waybackSubs)[0]!;
  const waybackNmi = getWaybackNMI();
  const curatedNmi = getCuratedNMI();
  const waybackNmiSubs = getWaybackNMISubindices();
  const waybackNmiSubsAny = Object.values(waybackNmiSubs)[0]!;
  const industryMonthly = industryMonthlyRaw as {
    observations: { date: string }[];
    lastVerifiedAt: string;
    provenance: string;
  };
  const usrec = getRecessions();
  const sectors = loadSectors();
  const policies = loadPolicies();

  const handEstimateCells = sectors.cells.filter((c) => c.provenance === "hand-estimate").length;

  // Distinguish two flavours of synthetic data the build can carry:
  //
  //   1. Vestigial NAPM stubs — the six ISM series FRED removed in June 2016
  //      at ISM's request (NAPM composite + the five Mfg subindices). The app
  //      doesn't read these; it uses the Wayback-scraped files. Kept inert.
  //
  //   2. Actionable placeholders — Services / NMI data files that ship as
  //      placeholders until `npm run import-wayback-nmi` (and then
  //      `import-wayback-nmi-subindices`) populates them from primary ISM
  //      sources via the Internet Archive.
  //
  // INDPRO, IPMAN, FEDFUNDS will not appear in either list when FRED_API_KEY
  // is set and `npm run refresh-data` has been run (their canonical state).
  const vestigialSynth = [pmi, ...subSummaries].filter((s) => s.provenance === "synthetic");
  const actionableSynth: { label: string; fix: string }[] = [];
  if (waybackNmi.provenance === "synthetic") {
    actionableSynth.push({
      label: `data/nmi-wayback.json (${waybackNmi.observations.length} placeholder rows)`,
      fix: "npm run import-wayback-nmi",
    });
  }
  if (waybackNmiSubsAny.provenance === "synthetic") {
    actionableSynth.push({
      label: `data/nmi-subindices-wayback.json (${waybackNmiSubsAny.observations.length} placeholder rows)`,
      fix: "npm run import-wayback-nmi-subindices",
    });
  }
  // FRED-only series that *would* be fixable by `refresh-data` if synthetic.
  const fixableFredSynth = [indpro, ipman, fedFunds].filter((s) => s.provenance === "synthetic");

  return (
    <div className="container max-w-3xl py-10 md:py-14">
      <p className="mb-2 text-caption uppercase tracking-wider text-accent-dark">About the data</p>
      <h1 className="font-serif text-display-2 text-ink-700">How accurate is this?</h1>

      <div className="editorial-prose mt-8 space-y-4">
        <p>
          Bellwether is a data product. Its credibility rests on showing you, for every number on
          the screen, where the number came from and when it was last verified. This page is the
          ledger.
        </p>
        <p>
          &quot;100% accurate&quot; is not literally achievable — FRED revises history, ISM revises
          the latest month after the fact, and the hand-curated content here involves editorial
          judgment. What we commit to instead is named provenance, recent verification, and visible
          caveats where reconciliation isn&apos;t possible.
        </p>
      </div>

      {(actionableSynth.length > 0 || fixableFredSynth.length > 0 || vestigialSynth.length > 0) && (
        <div className="editorial-prose mt-6 space-y-3 rounded-md border border-accent-dark/40 bg-accent-dark/10 p-4 text-ink-700">
          <p>
            <strong className="font-sans">Synthetic-data status.</strong>
          </p>
          {actionableSynth.length > 0 && (
            <div>
              <p className="font-sans text-caption uppercase tracking-wider text-ink-500">
                Replaceable — run the scraper
              </p>
              <ul className="mt-1 list-disc pl-5">
                {actionableSynth.map((s) => (
                  <li key={s.label}>
                    {s.label} — fix: <code>{s.fix}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fixableFredSynth.length > 0 && (
            <div>
              <p className="font-sans text-caption uppercase tracking-wider text-ink-500">
                Replaceable — pull from FRED
              </p>
              <p className="mt-1">
                {fixableFredSynth.length} FRED-sourced series {fixableFredSynth.length === 1 ? "is" : "are"} synthetic. Set <code>FRED_API_KEY</code> and run{" "}
                <code>npm run refresh-data</code> to populate them.
              </p>
            </div>
          )}
          {vestigialSynth.length > 0 && (
            <div>
              <p className="font-sans text-caption uppercase tracking-wider text-ink-500">
                Vestigial — informational only
              </p>
              <p className="mt-1">
                {vestigialSynth.length}{" "}legacy ISM FRED stubs ship as synthetic. These are the
                NAPM composite plus its five subindices — exactly the IDs FRED removed in June
                2016 at ISM&apos;s request. The app reads the Wayback-scraped files{" "}
                (<code>data/pmi-wayback.json</code> + <code>data/pmi-subindices-wayback.json</code>)
                instead, so these stubs are inert and not user-facing. No script can replace
                them.
              </p>
            </div>
          )}
        </div>
      )}

      <h2 className="mt-12 font-serif text-title-1 text-ink-700">Time series</h2>
      <p className="mt-2 text-body text-ink-500">
        The timeline spine is INDPRO (Industrial Production: Total Index) from FRED, shown as
        year-over-year % change. INDPRO covers the full 1948→present window and is freely
        redistributable. IPMAN (Manufacturing only) is also pulled from FRED for the period FRED
        carries it (1972→present). The legacy PMI series remains in the repo as a synthetic
        placeholder; FRED removed all 22 ISM series in June 2016 when ISM tightened redistribution
        licensing.
      </p>
      <p className="mt-3 text-body text-ink-500">
        For real PMI values we maintain three files. The bulk historical series in
        <code> data/pmi-historical.json</code> mirrors{" "}
        <a
          href="https://www.forecasts.org/data/data/NAPM.htm"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-ink-700"
        >
          the Financial Forecast Center page
        </a>{" "}
        and carries{" "}
        <strong>
          {historicalPmi.observations.length} observations from{" "}
          {historicalPmi.observations[0]?.date.slice(0, 7)} through{" "}
          {historicalPmi.observations.at(-1)?.date.slice(0, 7)}
        </strong>{" "}
        — that page froze in August 2014. <code>data/pmi-wayback.json</code> fills the modern era
        from primary ISM Manufacturing Report on Business pages captured by the Internet Archive
        ({" "}
        <strong>
          {waybackPmi.observations.length} observations,{" "}
          {waybackPmi.observations[0]?.date.slice(0, 7)} →{" "}
          {waybackPmi.observations.at(-1)?.date.slice(0, 7)}
        </strong>
        , with a structural 2015-04 → 2020-05 gap where ISM&apos;s monthly ROB URLs weren&apos;t
        reliably indexed by Wayback). Wayback typically trails the live release by several
        months; recent headline prints are ingested instead from ISM&apos;s monthly press
        releases on{" "}
        <a
          href="https://www.prnewswire.com/news/institute-for-supply-management/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-ink-700"
        >
          PRNewswire
        </a>{" "}
        and stored in <code>data/pmi-curated.json</code>{" "}
        ({curatedPmi.observations.length} obs, latest{" "}
        {curatedPmi.observations.at(-1)?.date.slice(0, 7) ?? "—"}; refresh with{" "}
        <code>npm run import-prnewswire</code>). Curated rows win over Wayback and the historical
        mirror on date overlap. Each row in any of the three files carries its own{" "}
        <code>sourceUrl</code>. The current-state panel on the homepage shows the merged view,
        the import workflows are documented in <code>data/CONTRIBUTING.md</code>, and the legal
        posture (Feist + ISM attribution) is documented in <code>data/LICENSING.md</code>.
      </p>
      <p className="mt-3 text-body text-ink-500">
        The five ISM <GlossaryTerm slug="subindex">subindices</GlossaryTerm> ({" "}
        <GlossaryTerm slug="new-orders">New Orders</GlossaryTerm>,{" "}
        <GlossaryTerm slug="production">Production</GlossaryTerm>,{" "}
        <GlossaryTerm slug="employment">Employment</GlossaryTerm>,{" "}
        <GlossaryTerm slug="supplier-deliveries">Supplier Deliveries</GlossaryTerm>,{" "}
        <GlossaryTerm slug="inventories">Inventories</GlossaryTerm>) are extracted from the same
        Wayback <GlossaryTerm slug="rob">ROB</GlossaryTerm> pages and stored together in{" "}
        <code>data/pmi-subindices-wayback.json</code> ({waybackSubsAny.observations.length}{" "}rows
        each). The /decompose mode reads from this file directly rather than the synthetic FRED
        placeholders. The /heatmap mode&apos;s 18 Pandemic-regime cells are derived from{" "}
        <code>data/industry-monthly-wayback.json</code>, which records the per-month
        growth/contraction industry lists from the same pages
        ({industryMonthly.observations.length}{" "}months · 18 industries).
      </p>

      <h2 className="mt-12 font-serif text-title-1 text-ink-700">
        Services / NMI series
      </h2>
      <p className="mt-2 text-body text-ink-500">
        The <GlossaryTerm slug="services-pmi">Services PMI</GlossaryTerm> (formerly{" "}
        <GlossaryTerm slug="nmi">NMI</GlossaryTerm>) is on the same Wayback-plus-press-release
        pattern as Manufacturing, with one omission: there is no third-party historical mirror
        for the 1997–~2014 backfill yet, so coverage before late 2014 is sparse.{" "}
        <code>data/nmi-wayback.json</code> carries{" "}
        <strong>
          {waybackNmi.observations.length} observation
          {waybackNmi.observations.length === 1 ? "" : "s"}
        </strong>{" "}
        ({waybackNmi.observations[0]?.date.slice(0, 7) ?? "—"} →{" "}
        {waybackNmi.observations.at(-1)?.date.slice(0, 7) ?? "—"}); the four headline subindices
        (<GlossaryTerm slug="business-activity">Business Activity</GlossaryTerm>,{" "}
        <GlossaryTerm slug="new-orders">New Orders</GlossaryTerm>,{" "}
        <GlossaryTerm slug="employment">Employment</GlossaryTerm>,{" "}
        <GlossaryTerm slug="supplier-deliveries">Supplier Deliveries</GlossaryTerm>) live
        alongside in <code>data/nmi-subindices-wayback.json</code>{" "}
        ({waybackNmiSubsAny.observations.length} rows each). Current-vintage headline prints come
        from ISM&apos;s monthly press releases on PRNewswire and live in{" "}
        <code>data/nmi-curated.json</code>{" "}
        ({curatedNmi.observations.length} obs, latest{" "}
        {curatedNmi.observations.at(-1)?.date.slice(0, 7) ?? "—"}; refresh alongside Manufacturing
        via <code>npm run import-prnewswire</code>). Subindex breakdowns for those recent months
        are still Wayback-only until the press-release scraper is extended to parse subindex
        tables.
      </p>
      {waybackNmi.provenance === "synthetic" && (
        <div className="editorial-prose mt-4 rounded-md border border-accent-dark/40 bg-accent-dark/10 p-4 text-ink-700">
          <strong className="font-sans">Heads up:</strong> the Services data files currently ship
          as synthetic placeholders. Run <code>npm run import-wayback-nmi</code> followed by{" "}
          <code>npm run import-wayback-nmi-subindices</code> to populate them from primary ISM
          sources via the Internet Archive.
        </div>
      )}
      <DataTable
        rows={[
          {
            label: "NMI / Services PMI Composite (Wayback archive of ISM ROB pages)",
            provenance: waybackNmi.provenance,
            lastVerifiedAt: waybackNmi.lastVerifiedAt,
            latestObservation: waybackNmi.observations.at(-1)?.date ?? "—",
            n: waybackNmi.observations.length,
          },
          ...Object.entries(waybackNmiSubs).map(([, series]) => ({
            label: series.title,
            provenance: series.provenance,
            lastVerifiedAt: series.lastVerifiedAt,
            latestObservation: series.observations.at(-1)?.date ?? "—",
            n: series.observations.length,
          })),
          {
            label: "NMI / Services PMI Composite (PRNewswire press releases, curated)",
            provenance: curatedNmi.provenance,
            lastVerifiedAt: curatedNmi.lastVerifiedAt,
            latestObservation: curatedNmi.observations.at(-1)?.date ?? "—",
            n: curatedNmi.observations.length,
          },
        ]}
      />
      <DataTable
        rows={[
          { label: "INDPRO (Industrial Production: Total)", ...indpro },
          { label: "IPMAN (Industrial Production: Manufacturing)", ...ipman },
          { label: "PMI Composite (NAPM, FRED placeholder)", ...pmi },
          {
            label: "PMI Composite (forecasts.org mirror, 1948→2014)",
            provenance: historicalPmi.provenance,
            lastVerifiedAt: historicalPmi.lastVerifiedAt,
            latestObservation: historicalPmi.observations.at(-1)?.date ?? "—",
            n: historicalPmi.observations.length,
          },
          {
            label: "PMI Composite (Wayback archive of ISM ROB pages)",
            provenance: waybackPmi.provenance,
            lastVerifiedAt: waybackPmi.lastVerifiedAt,
            latestObservation: waybackPmi.observations.at(-1)?.date ?? "—",
            n: waybackPmi.observations.length,
          },
          {
            label: "PMI Composite (PRNewswire press releases, curated)",
            provenance: curatedPmi.provenance,
            lastVerifiedAt: curatedPmi.lastVerifiedAt,
            latestObservation: curatedPmi.observations.at(-1)?.date ?? "—",
            n: curatedPmi.observations.length,
          },
          ...subSummaries.map((s) => ({ label: `${s.title} (FRED placeholder)`, ...s })),
          ...Object.entries(waybackSubs).map(([, series]) => ({
            label: `${series.title}`,
            provenance: series.provenance,
            lastVerifiedAt: series.lastVerifiedAt,
            latestObservation: series.observations.at(-1)?.date ?? "—",
            n: series.observations.length,
          })),
          {
            label: "Industry-level monthly growth/contraction lists (Wayback)",
            provenance: industryMonthly.provenance,
            lastVerifiedAt: industryMonthly.lastVerifiedAt,
            latestObservation: industryMonthly.observations.at(-1)?.date ?? "—",
            n: industryMonthly.observations.length,
          },
          { label: fedFunds.title, ...fedFunds },
        ]}
      />

      <h2 className="mt-12 font-serif text-title-1 text-ink-700">Recession periods (NBER)</h2>
      <p className="mt-2 text-body text-ink-500">
        {usrec.periods.length}{" "}periods, hand-curated from the NBER Business Cycle Dating
        Committee&apos;s announcements. Each period is anchored to its public announcement URL;
        <code>scripts/verify-nber.ts</code> checks every link is reachable.
      </p>
      <p className="mt-2 text-caption text-ink-400">
        Last verified {usrec.lastVerifiedAt} · provenance: {provenanceLabels[usrec.provenance]}
      </p>

      <h2 className="mt-12 font-serif text-title-1 text-ink-700">Sector heatmap</h2>
      <p className="mt-2 text-body text-ink-500">
        18 industries × 5 policy regimes = {sectors.cells.length}{" "}cells.{" "}
        {sectors.cells.length - handEstimateCells > 0 ? (
          <>
            <strong className="text-ink-700">
              {sectors.cells.length - handEstimateCells}{" "}cell
              {sectors.cells.length - handEstimateCells === 1 ? " is" : "s are"}{" "}computed from primary ISM monthly Reports on Business
            </strong>{" "}
            (the 18 Pandemic & Reshoring cells, derived from per-month industry growth/contraction
            lists scraped via the Wayback Machine archive). The remaining{" "}
          </>
        ) : (
          <>Currently </>
        )}
        {handEstimateCells}{" "}cells are{" "}
        <strong className="text-ink-700">hand estimates</strong>{" "}
        drawn from monthly ISM commentary
        — not direct ISM industry-level data — because comparable per-month data isn&apos;t
        publicly archived for the Bretton Woods, Stagflation, Great Moderation, or Crisis &
        Recovery eras. Cells render an <strong className="text-ink-700">Estimate</strong> badge
        accordingly.
      </p>
      <p className="mt-2 text-caption text-ink-400">
        Last verified {sectors.lastVerifiedAt} · breakdown:{" "}
        {Object.entries(
          sectors.cells.reduce<Record<string, number>>((acc, c) => {
            acc[c.provenance] = (acc[c.provenance] ?? 0) + 1;
            return acc;
          }, {}),
        )
          .map(([k, n]) => `${n} ${sectorProvenanceLabels[k as keyof typeof sectorProvenanceLabels]}`)
          .join(" · ")}
      </p>

      <h2 className="mt-12 font-serif text-title-1 text-ink-700">Policy events &amp; interpretations</h2>
      <p className="mt-2 text-body text-ink-500">
        {policies.length} policy events on the timeline. Each is required by the schema to carry at
        least one primary source (a government release, the policy text, or a peer-reviewed paper),
        plus a verification date. Economist interpretations are summaries of published positions —
        the source list under each card is where you go to verify.
      </p>
      <ul className="mt-4 space-y-1 text-caption text-ink-500">
        {policies.map((p) => (
          <li key={p.id}>
            <span className="text-ink-700">{p.title}</span> · {p.sources.length} sources · last
            verified {p.verifiedAt}
          </li>
        ))}
      </ul>

      <h2 className="mt-12 font-serif text-title-1 text-ink-700">How to spot an error</h2>
      <div className="editorial-prose mt-4">
        <p>
          The schema rejects data without provenance, primary citations, or verification dates at
          load time, so silent regressions are unlikely. A monthly GitHub Actions cron
          (<code>.github/workflows/data-refresh.yml</code>) re-pulls FRED snapshots after each ISM
          release; the per-row source URL plus the strict-mode freshness test{" "}
          (<code>STRICT_DATA_CHECKS=1 npm run check-data</code>) catch most drift. If you spot a
          number that looks wrong, please open an issue with the cell, the value you see, and the
          source you&apos;re comparing to.
        </p>
        <p>
          Want to read the editorial method?{" "}
          <Link href="/about" className="underline hover:text-ink-700">
            That&apos;s a separate page.
          </Link>
        </p>
      </div>
    </div>
  );
}

function DataTable({
  rows,
}: {
  rows: { label: string; provenance: string; lastVerifiedAt: string; latestObservation: string; n: number }[];
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-md border border-ink-700/15">
      <table className="w-full text-caption">
        <thead className="bg-ink-700/5 text-ink-500">
          <tr>
            <th className="px-3 py-2 text-left font-sans font-medium">Series</th>
            <th className="px-3 py-2 text-left font-sans font-medium">Provenance</th>
            <th className="px-3 py-2 text-left font-sans font-medium">Latest obs.</th>
            <th className="px-3 py-2 text-left font-sans font-medium">Verified</th>
            <th className="px-3 py-2 text-right font-sans font-medium">N</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-ink-700/10">
              <td className="px-3 py-2 text-ink-700">{r.label}</td>
              <td className="px-3 py-2 text-ink-500">
                {provenanceLabels[r.provenance as keyof typeof provenanceLabels] ?? r.provenance}
              </td>
              <td className="px-3 py-2 text-ink-500">{r.latestObservation}</td>
              <td className="px-3 py-2 text-ink-500">{r.lastVerifiedAt}</td>
              <td className="px-3 py-2 text-right text-ink-500">{r.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
