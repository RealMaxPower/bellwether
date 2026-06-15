import Link from "next/link";
import { SectorHeatmap } from "@/components/heatmap/sector-heatmap";
import { PageHero } from "@/components/layout/page-hero";
import { GlossaryTerm } from "@/components/ui/glossary-term";
import { loadSectors, loadSectorsServices } from "@/lib/data/sectors";
import { getPMI } from "@/lib/data/series";
import { cn } from "@/lib/utils";

type Report = "manufacturing" | "services";

interface HeatmapPageProps {
  searchParams?: Promise<{ report?: string }>;
}

export default async function HeatmapPage({ searchParams }: HeatmapPageProps) {
  const params = (await searchParams) ?? {};
  const report: Report = params.report === "services" ? "services" : "manufacturing";
  const sectors = report === "services" ? loadSectorsServices() : loadSectors();
  const pmi = getPMI();
  const first = pmi.observations[0];
  const last = pmi.observations[pmi.observations.length - 1];
  if (!first || !last) throw new Error("PMI series has no observations");
  const seriesStart = first.date.slice(0, 4);
  const seriesEnd = last.date.slice(0, 4);

  const waybackCells = sectors.cells.filter((c) => c.provenance === "wayback-archive").length;
  const handEstimateCells = sectors.cells.filter((c) => c.provenance === "hand-estimate").length;

  return (
    <div className="bg-paper">
      <PageHero
        number={4}
        eyebrow="Sector Heatmap"
        headline={
          <>
            The aggregate is the <em>average</em>.
          </>
        }
        lede={
          report === "services" ? (
            <>
              Behind the <GlossaryTerm slug="services-pmi">Services PMI</GlossaryTerm> sit
              eighteen non-manufacturing industries, from Construction to Health Care. The
              matrix below is currently a 90-cell editorial scaffold — score 0 in every cell —
              pending research from primary ISM Services Reports on Business. Three of the five
              policy regimes (Bretton Woods, Stagflation, much of Great Moderation) predate
              Services PMI&apos;s 1997 launch, so no primary-source data exists for those eras.
            </>
          ) : (
            <>
              Behind the headline <GlossaryTerm slug="pmi">PMI</GlossaryTerm> sit eighteen
              industries. Apparel collapsed; semiconductors boomed. The matrix below maps each
              industry against five policy regimes, so you can see who won and who lost under
              what.
            </>
          )
        }
        meta={[
          { label: "Series", value: report === "services" ? "NMI" : "NAPM" },
          { label: "Frequency", value: "Monthly" },
          { label: "Source", value: "FRED + ISM" },
          { label: "Coverage", value: `${seriesStart} → ${seriesEnd}` },
        ]}
      />

      <div className="mx-auto max-w-[1280px] px-8 py-7">
        <ReportToggle active={report} />

        {report === "services" ? (
          <p className="mb-6 max-w-[80ch] border-l-2 border-oxblood/60 bg-paper-2/50 px-4 py-3 font-serif text-[13px] leading-snug text-ink-500">
            <strong className="not-italic font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-oxblood">
              Mixed provenance
            </strong>
            <br />
            The {waybackCells}{" "}Pandemic &amp; Reshoring cells are computed from primary ISM
            monthly Services Reports on Business (<GlossaryTerm slug="rob">ROB</GlossaryTerm>)
            archived on the Wayback Machine — score is each industry&apos;s growth-month
            percentage, mapped to the −100…+100 scale. The other{" "}
            {sectors.cells.length - waybackCells}{" "}cells across four pre-Pandemic regimes are
            scaffold placeholders pending editorial research; three of those four regimes
            (Bretton Woods, Stagflation, most of the Great Moderation) predate Services
            PMI&apos;s 1997 launch entirely and will permanently remain &quot;n/a&quot;. Hover or
            click a cell for its citation chain;{" "}
            <Link href="/about-the-data" className="underline hover:text-ink-700">
              the data ledger
            </Link>{" "}
            tracks every cell&apos;s provenance.
          </p>
        ) : (
          <p className="mb-6 max-w-[68ch] border-l-2 border-oxblood/60 bg-paper-2/50 px-4 py-3 font-serif text-[13px] leading-snug text-ink-500">
            <strong className="not-italic font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-oxblood">
              Mixed provenance
            </strong>
            <br />
            The {waybackCells}{" "}Pandemic &amp; Reshoring cells are computed from primary ISM
            monthly Reports on Business (<GlossaryTerm slug="rob">ROB</GlossaryTerm>) archived
            on the Wayback Machine — score is each industry&apos;s growth-month percentage,
            mapped to the −100…+100 scale. The other{" "}
            {handEstimateCells - waybackCells > 0 ? handEstimateCells : "remaining"}{" "}cells across four regimes
            remain editorial estimates because comparable per-month industry-level data
            isn&apos;t publicly archived for those eras. Hover or click a cell for its citation
            chain;{" "}
            <Link href="/about-the-data" className="underline hover:text-ink-700">
              the data ledger
            </Link>{" "}
            tracks every cell&apos;s provenance.
          </p>
        )}
        <SectorHeatmap data={sectors} />
      </div>
    </div>
  );
}

function ReportToggle({ active }: { active: Report }) {
  const tabs: { report: Report; href: string; label: string; sub: string }[] = [
    {
      report: "manufacturing",
      href: "/heatmap",
      label: "Manufacturing",
      sub: "18 industries · 1948→",
    },
    {
      report: "services",
      href: "/heatmap?report=services",
      label: "Services",
      sub: "18 industries · data forthcoming",
    },
  ];
  return (
    <div className="mb-6 inline-flex border border-paper-edge bg-paper">
      {tabs.map((t) => {
        const isActive = active === t.report;
        return (
          <Link
            key={t.report}
            href={t.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col px-5 py-2.5 font-sans text-[11px] uppercase tracking-[0.08em] transition-colors",
              isActive
                ? "bg-oxblood text-paper"
                : "text-ink-400 hover:bg-paper-2 hover:text-ink-700",
            )}
          >
            <span className="font-semibold">{t.label}</span>
            <span
              className={cn(
                "mt-0.5 text-[10px] tracking-normal",
                isActive ? "text-paper/70" : "text-ink-300",
              )}
            >
              {t.sub}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
