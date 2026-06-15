import Link from "next/link";
import { DecomposeMode } from "@/components/decompose/decompose-mode";
import { PageHero } from "@/components/layout/page-hero";
import { MiniExhibit } from "@/components/background/mini-exhibit";
import { GlossaryTerm } from "@/components/ui/glossary-term";
import {
  getRecessions,
  getWaybackNMISubindexComposite,
  getWaybackNMISubindices,
  getWaybackSubindexComposite,
  getWaybackSubindices,
} from "@/lib/data/series";
import {
  ismDefaultWeights,
  servicesDefaultWeights,
  servicesSubindexLabels,
  servicesSubindexNames,
  subindexLabels,
  subindexNames,
} from "@/lib/data/schemas";
import { decomposePresets, servicesDecomposePresets } from "@/lib/decompose/blend";
import { getEntryById } from "@/lib/background/lookup";
import { cn } from "@/lib/utils";

type Report = "manufacturing" | "services";

interface DecomposePageProps {
  searchParams?: Promise<{ report?: string }>;
}

export default async function DecomposePage({ searchParams }: DecomposePageProps) {
  const params = (await searchParams) ?? {};
  const report: Report = params.report === "services" ? "services" : "manufacturing";

  const recessions = getRecessions();
  const napm1931 = getEntryById("report-on-business-1931");

  const config =
    report === "services"
      ? {
          pmi: getWaybackNMISubindexComposite(),
          subindices: getWaybackNMISubindices() as Record<string, ReturnType<typeof getWaybackNMISubindexComposite>>,
          names: servicesSubindexNames as readonly string[],
          labels: servicesSubindexLabels as Record<string, string>,
          defaultWeights: servicesDefaultWeights as Record<string, number>,
          presets: servicesDecomposePresets,
          storageKey: "bellwether.decompose.services.weights.v1",
          reportHeadlineLabel: "ISM Services PMI",
          headlineEm: "four numbers",
          metaSeries: "Services Subindices",
        }
      : {
          pmi: getWaybackSubindexComposite(),
          subindices: getWaybackSubindices() as Record<string, ReturnType<typeof getWaybackSubindexComposite>>,
          names: subindexNames as readonly string[],
          labels: subindexLabels as Record<string, string>,
          defaultWeights: ismDefaultWeights as Record<string, number>,
          presets: decomposePresets,
          storageKey: "bellwether.decompose.weights.v1",
          reportHeadlineLabel: "ISM PMI",
          headlineEm: "five numbers",
          metaSeries: "NAPM Subindices",
        };

  const first = config.pmi.observations[0];
  const last = config.pmi.observations[config.pmi.observations.length - 1];
  if (!first || !last) {
    throw new Error(
      `${report === "services" ? "Services" : "Manufacturing"} subindex series has no observations — run the corresponding Wayback scraper.`,
    );
  }
  const seriesStart = first.date.slice(0, 4);
  const seriesEnd = last.date.slice(0, 4);

  return (
    <div className="bg-paper">
      <PageHero
        number={2}
        eyebrow="Decompose"
        headline={
          <>
            The headline number is <em>{config.headlineEm}</em>.
          </>
        }
        lede={
          report === "services" ? (
            <>
              The Services{" "}
              <GlossaryTerm slug="services-pmi">PMI</GlossaryTerm> is an equal-weighted blend of
              four subindices —{" "}
              <GlossaryTerm slug="business-activity">Business Activity</GlossaryTerm>,{" "}
              <GlossaryTerm slug="new-orders">New Orders</GlossaryTerm>,{" "}
              <GlossaryTerm slug="employment">Employment</GlossaryTerm>, and{" "}
              <GlossaryTerm slug="supplier-deliveries">Supplier Deliveries</GlossaryTerm>{" "}
              (Manufacturing has five; Services has no Inventories or Production component in its
              headline). Reweight them on the right; watch your custom blend redraw against the
              actual series.
            </>
          ) : (
            <>
              <GlossaryTerm slug="pmi">PMI</GlossaryTerm> is a fixed weighted blend of{" "}
              <GlossaryTerm slug="new-orders">New Orders</GlossaryTerm>,{" "}
              <GlossaryTerm slug="production">Production</GlossaryTerm>,{" "}
              <GlossaryTerm slug="employment">Employment</GlossaryTerm>,{" "}
              <GlossaryTerm slug="supplier-deliveries">Supplier Deliveries</GlossaryTerm>, and{" "}
              <GlossaryTerm slug="inventories">Inventories</GlossaryTerm>. Reweight them on the
              right; watch your custom blend redraw against the actual series — and see whether
              your weights would have caught the last twelve recessions.
            </>
          )
        }
        meta={[
          { label: "Series", value: config.metaSeries },
          { label: "Frequency", value: "Monthly" },
          { label: "Source", value: "Wayback / ISM ROB" },
          { label: "Coverage", value: `${seriesStart} → ${seriesEnd}` },
        ]}
      />

      <div className="mx-auto max-w-[1280px] px-8 py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <ReportToggle active={report} />
          <p className="max-w-[60ch] border-l-2 border-oxblood/60 pl-3 font-serif text-[12px] leading-snug text-ink-400">
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-oxblood">
              Coverage
            </span>{" "}
            {report === "services" ? (
              <>
                Wayback-extracted from ISM Services ROB. 2014-09 → 2015-03 and 2020-07 → present;
                gap 2015-04 → 2020-06. Series began 1997.{" "}
                <Link href="/about-the-data" className="underline hover:text-ink-700">
                  Data ledger →
                </Link>
              </>
            ) : (
              <>
                Wayback-extracted from ISM ROB. 2014-09 → 2015-03 and 2020-06 → present; gap
                2015-04 → 2020-05 (COVID covered; 2008–09 isn&apos;t).{" "}
                <Link href="/about-the-data" className="underline hover:text-ink-700">
                  Data ledger →
                </Link>
              </>
            )}
          </p>
        </div>
        <DecomposeMode
          pmi={config.pmi}
          subindices={config.subindices}
          recessions={recessions.periods}
          names={config.names}
          labels={config.labels}
          defaultWeights={config.defaultWeights}
          presets={config.presets}
          storageKey={config.storageKey}
          reportHeadlineLabel={config.reportHeadlineLabel}
        />

        {report === "manufacturing" && napm1931 && (
          <div className="mt-10 border-t border-paper-edge pt-8">
            <p className="eyebrow mb-4 text-ink-300">Where this index came from</p>
            <MiniExhibit entry={napm1931} />
          </div>
        )}
      </div>
    </div>
  );
}

function ReportToggle({ active }: { active: Report }) {
  const tabs: { report: Report; href: string; label: string; sub: string }[] = [
    {
      report: "manufacturing",
      href: "/decompose",
      label: "Manufacturing",
      sub: "5 subindices · 1948→",
    },
    {
      report: "services",
      href: "/decompose?report=services",
      label: "Services",
      sub: "4 subindices · 1997→",
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
