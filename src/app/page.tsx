import Link from "next/link";
import { Suspense } from "react";
import { TimelineMode } from "@/components/timeline/timeline-mode";
import { PMITimeline } from "@/components/timeline/pmi-timeline";
import { PageHero } from "@/components/layout/page-hero";
import { CurrentStatePanel } from "@/components/timeline/current-state-panel";
import { MiniExhibit } from "@/components/background/mini-exhibit";
import {
  getCuratedPMI,
  getINDPROYoY,
  getMergedNMI,
  getMergedPMI,
  getRecessions,
} from "@/lib/data/series";
import { loadPolicies } from "@/lib/content/load-policies";
import { getEntryById } from "@/lib/background/lookup";

export const metadata = {
  title: "Bellwether — ISM PMI in historical and policy context",
  description:
    "An interactive 75-year atlas of the ISM Manufacturing PMI alongside US economic policy decisions. Live data, primary-source citations, and four ways to explore: timeline, decompose, Fed Chair game, sector heatmap.",
};

export default function HomePage() {
  const indpro = getINDPROYoY();
  const recessions = getRecessions();
  const policies = loadPolicies();
  const curatedPmi = getCuratedPMI();
  const mergedPmi = getMergedPMI();
  const mergedNmi = getMergedNMI();
  const napm1931 = getEntryById("report-on-business-1931");
  const fedAct1913 = getEntryById("fed-act-1913");

  const obs = indpro.observations;
  const first = obs[0];
  const latest = obs[obs.length - 1];
  if (!first || !latest) throw new Error("INDPRO series has no observations");
  const seriesStart = first.date.slice(0, 4);
  const seriesEnd = latest.date.slice(0, 4);

  return (
    <div className="bg-paper">
      <PageHero
        number={1}
        eyebrow="Master Timeline"
        headline={
          <>
            Seventy-five years of <em>signal</em>,
            <br className="hidden md:block" /> in one line.
          </>
        }
        lede={
          <>
            US industrial production grows in expansions and falls in recessions. The line below
            tracks year-over-year change in output every month from {seriesStart}{" "}to today —
            paired with the policy decisions that bent its trajectory. Click any event for three
            economists&rsquo; readings.
          </>
        }
        meta={[
          { label: "Series", value: "INDPRO (Y/Y %)" },
          { label: "Frequency", value: "Monthly" },
          { label: "Source", value: "FRED" },
          { label: "Coverage", value: `${seriesStart} → ${seriesEnd}` },
          { label: "Verified", value: indpro.lastVerifiedAt },
        ]}
      />

      <section className="mx-auto max-w-[1280px] px-8 pt-7">
        <CurrentStatePanel
          pmi={mergedPmi}
          nmi={mergedNmi.observations.length > 0 ? mergedNmi : undefined}
          indpro={indpro}
          recessions={recessions}
        />
      </section>

      <section
        className="mx-auto max-w-[1280px] px-8 pt-7"
        aria-label="Two institutions, one timeline"
      >
        <p className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          Two institutions, one timeline
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {fedAct1913 && <MiniExhibit entry={fedAct1913} />}
          {napm1931 && <MiniExhibit entry={napm1931} />}
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-8 py-7">
        <Suspense fallback={<div className="h-[480px] animate-pulse bg-ink-100/60" />}>
          <TimelineMode
            pmiObservations={indpro.observations}
            recessions={recessions.periods}
            policies={policies}
            title={
              <>
                Industrial production Y/Y % with ISM PMI markers,{" "}
                <span className="font-normal italic text-ink-400">
                  {seriesStart}{" "}to present
                </span>
              </>
            }
            seriesLabel="INDPRO Y/Y %"
            yTicks={[-30, -15, 0, 15]}
            yDomain={[-32, 32]}
            threshold={0}
            thresholdLabel="Expansion / contraction"
            valueSuffix="%"
            valueDecimals={1}
            pmiMarkers={curatedPmi.observations}
          />
        </Suspense>

        {mergedNmi.observations.length > 0 && (
          <ServicesTimelineFigure
            observations={mergedNmi.observations}
            recessions={recessions.periods}
          />
        )}

        <section className="mt-16 grid grid-cols-1 gap-px border border-ink-700 bg-ink-700 md:grid-cols-2 lg:grid-cols-4">
          <ModeCard
            href="/"
            title="Timeline"
            description="PMI spine + every major US policy. Default view."
            active
          />
          <ModeCard
            href="/decompose"
            title="Decompose"
            description="Reweight the five subindices. Backtest against recessions."
          />
          <ModeCard
            href="/fed-chair"
            title="Fed Chair"
            description="Era-locked decision game. Five real moments."
          />
          <ModeCard
            href="/heatmap"
            title="Heatmap"
            description="18 industries × 5 policy regimes. Who won, who lost."
          />
        </section>
      </div>
    </div>
  );
}

function ServicesTimelineFigure({
  observations,
  recessions,
}: {
  observations: ReturnType<typeof getMergedNMI>["observations"];
  recessions: ReturnType<typeof getRecessions>["periods"];
}) {
  return (
    <figure className="mt-12 border border-ink-700 bg-paper">
      <header className="flex items-start justify-between gap-6 px-6 pt-5">
        <div>
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Figure 2 · Services PMI
          </p>
          <h2 className="mt-2 font-serif text-[22px] font-medium leading-tight text-ink-700">
            ISM Services PMI,{" "}
            <span className="font-normal italic text-ink-400">1997 to present</span>
          </h2>
        </div>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 font-sans text-[11px] text-ink-500">
          <li className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-px w-5 bg-ink-700" />
            Services PMI
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-3 w-3 bg-paper-edge/70" />
            NBER recession
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-[2px] w-5 bg-ink-700" />
            <span>
              50 · <span className="text-ink-400">expansion / contraction</span>
            </span>
          </li>
        </ul>
      </header>
      <div className="relative px-2 pb-2 pt-2">
        <PMITimeline
          observations={observations}
          recessions={recessions}
          dims={{
            width: 1200,
            height: 280,
            chartHeight: 280,
            marginLeft: 48,
            marginRight: 24,
            marginTop: 24,
            marginBottom: 28,
          }}
          yTicks={[40, 45, 50, 55, 60, 65]}
          yDomain={[38, 67]}
          threshold={50}
          valueDecimals={1}
          breakAtGapMonths={3}
        />
      </div>
      <footer className="border-t border-paper-edge px-6 py-3">
        <p className="font-serif text-[12px] italic text-ink-400">
          Wayback-extracted from ISM Services ROB. Coverage: 2014-09 → 2015-03 and 2020-07 →
          present, with a structural 2015-04 → 2020-06 gap.
        </p>
      </footer>
    </figure>
  );
}

function ModeCard({
  href,
  title,
  description,
  active,
}: {
  href: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex min-h-[110px] flex-col gap-1.5 border-t-2 px-4 py-4 transition-colors ${
        active
          ? "border-oxblood bg-paper-2"
          : "border-transparent bg-paper hover:bg-paper-2"
      }`}
    >
      <span className="font-serif text-title-2 font-medium leading-tight text-ink-700">
        {title}
      </span>
      <span className="font-serif text-[12px] italic leading-snug text-ink-400">
        {description}
      </span>
      <span className="mt-auto font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-oxblood group-hover:underline">
        Open →
      </span>
    </Link>
  );
}
