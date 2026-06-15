"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PMITimeline } from "./pmi-timeline";
import { PolicyLane, PolicyLaneLegend } from "./policy-lane";
import { PolicyCard } from "./policy-card";
import { NumberedIndex } from "./numbered-index";
import type { MonthlyObservation, RecessionPeriod } from "@/lib/data/schemas";
import type { PolicyFrontmatter } from "@/lib/content/policy-schema";

export interface TimelineModeProps {
  pmiObservations: readonly MonthlyObservation[];
  recessions: readonly RecessionPeriod[];
  policies: readonly PolicyFrontmatter[];
  /** Headline above the chart. */
  title?: React.ReactNode;
  /** Legend label for the line. Default "PMI". */
  seriesLabel?: string;
  /** Y-axis tick values. */
  yTicks?: readonly number[];
  /** Y-axis domain (min, max). */
  yDomain?: [number, number];
  /** Threshold value where the chart's expansion/contraction line is drawn. */
  threshold?: number;
  /** Label shown alongside the threshold value in the legend. */
  thresholdLabel?: string;
  /** Suffix appended to tooltip values (e.g. "%"). */
  valueSuffix?: string;
  /** Decimals shown in tooltip + axis labels. */
  valueDecimals?: number;
  /** Optional hand-curated PMI markers overlaid on the chart. */
  pmiMarkers?: readonly { date: string; value: number; sourceUrl: string }[];
  /** Optional ISM Services PMI / NMI series, overlaid as a teal dashed line. */
  nmiObservations?: readonly MonthlyObservation[];
}

/**
 * Interactive timeline + policy markers + interpretation drawer + numbered
 * event index. Reads `?policy=<id>` to deep-link an open card.
 */
export function TimelineMode({
  pmiObservations,
  recessions,
  policies,
  title,
  seriesLabel = "PMI",
  yTicks,
  yDomain,
  threshold,
  thresholdLabel,
  valueSuffix,
  valueDecimals,
  pmiMarkers,
  nmiObservations,
}: TimelineModeProps) {
  const router = useRouter();
  const search = useSearchParams();
  const policyParam = search?.get("policy");

  const [selectedId, setSelectedId] = React.useState<string | null>(policyParam ?? null);

  React.useEffect(() => {
    setSelectedId(policyParam ?? null);
  }, [policyParam]);

  const selected = selectedId ? policies.find((p) => p.id === selectedId) ?? null : null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const params = new URLSearchParams(search?.toString() ?? "");
    params.set("policy", id);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedId(null);
      const params = new URLSearchParams(search?.toString() ?? "");
      params.delete("policy");
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    }
  };

  return (
    <>
      <figure className="border border-ink-700 bg-paper">
        <header className="flex items-start justify-between gap-6 px-6 pt-5">
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              Figure 1 · Master Timeline
            </p>
            <h2 className="mt-2 font-serif text-[22px] font-medium leading-tight text-ink-700">
              {title ?? (
                <>
                  ISM Manufacturing PMI,{" "}
                  <span className="font-normal italic text-ink-400">1948 to present</span>
                </>
              )}
            </h2>
          </div>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 font-sans text-[11px] text-ink-500">
            <li className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-px w-5 bg-ink-700" />
              {seriesLabel}
            </li>
            {nmiObservations && nmiObservations.length > 0 && (
              <li className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-px w-5 border-t border-dashed border-teal"
                />
                Services PMI (1997→)
              </li>
            )}
            {pmiMarkers && pmiMarkers.length > 0 && (
              <li className="flex items-center gap-2">
                <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-accent" />
                ISM PMI marker
              </li>
            )}
            <li className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-3 w-3 bg-paper-edge/70" />
              NBER recession
            </li>
            {thresholdLabel && (
              <li className="flex items-center gap-2">
                <span aria-hidden className="inline-block h-[2px] w-5 bg-ink-700" />
                <span>
                  {threshold ?? 0} ·{" "}
                  <span className="text-ink-400">{thresholdLabel.toLowerCase()}</span>
                </span>
              </li>
            )}
          </ul>
        </header>

        <div className="relative px-2 pb-2 pt-2">
          <PMITimeline
            observations={pmiObservations}
            recessions={recessions}
            yTicks={yTicks}
            yDomain={yDomain}
            threshold={threshold}
            valueSuffix={valueSuffix}
            valueDecimals={valueDecimals}
            pmiMarkers={pmiMarkers}
            nmiObservations={nmiObservations}
          >
            <PolicyLane
              policies={policies}
              observations={pmiObservations}
              onSelect={handleSelect}
            />
          </PMITimeline>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-paper-edge px-6 py-3">
          <PolicyLaneLegend />
          <p className="font-serif text-[12px] italic text-ink-400">
            Click any numbered marker for three economist interpretations.
          </p>
        </footer>
      </figure>

      <NumberedIndex policies={policies} onSelect={handleSelect} />

      <PolicyCard policy={selected} open={selected !== null} onOpenChange={handleOpenChange} />
    </>
  );
}
