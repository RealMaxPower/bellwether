"use client";

import * as React from "react";
import { useTimeline } from "./timeline-context";
import type { PolicyFrontmatter, PolicyKind } from "@/lib/content/policy-schema";
import type { MonthlyObservation } from "@/lib/data/schemas";

export interface PolicyLaneProps {
  policies: readonly PolicyFrontmatter[];
  /** PMI series to anchor the colored dot at each policy date. */
  observations: readonly MonthlyObservation[];
  onSelect: (id: string) => void;
}

const KIND_STROKE: Record<PolicyKind, string> = {
  monetary: "stroke-policy-monetary",
  fiscal: "stroke-policy-fiscal",
  trade: "stroke-policy-trade",
  regulatory: "stroke-policy-regulatory",
  exogenous: "stroke-policy-exogenous",
};
const KIND_FILL: Record<PolicyKind, string> = {
  monetary: "fill-policy-monetary",
  fiscal: "fill-policy-fiscal",
  trade: "fill-policy-trade",
  regulatory: "fill-policy-regulatory",
  exogenous: "fill-policy-exogenous",
};
const KIND_TEXT: Record<PolicyKind, string> = {
  monetary: "fill-policy-monetary",
  fiscal: "fill-policy-fiscal",
  trade: "fill-policy-trade",
  regulatory: "fill-policy-regulatory",
  exogenous: "fill-policy-exogenous",
};

/**
 * Numbered policy markers above the chart. Each policy gets:
 *   • a numbered circle in the upper margin, color-coded by kind
 *   • a dashed drop-line down to the PMI value at that date
 *   • a colored dot on the PMI line at the data point
 */
export function PolicyLane({ policies, observations, onSelect }: PolicyLaneProps) {
  const { xScale, yScale, dims } = useTimeline();

  // Order by start date so the numbered index reads chronologically.
  const ordered = React.useMemo(
    () => [...policies].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [policies],
  );

  // Snap each policy to the nearest monthly observation to read off the PMI value.
  const obsByIso = React.useMemo(() => {
    const map = new Map<string, number>();
    observations.forEach((o) => map.set(o.date, o.value));
    return map;
  }, [observations]);
  const valueAt = React.useCallback(
    (iso: string): number | null => {
      const direct = obsByIso.get(iso);
      if (direct !== undefined) return direct;
      // Fallback: scan for the closest preceding observation in the same year.
      const year = iso.slice(0, 4);
      const sameYear = observations.filter((o) => o.date.startsWith(year));
      if (sameYear.length === 0) return null;
      const target = new Date(iso).getTime();
      const closest = sameYear.reduce((best, o) =>
        Math.abs(new Date(o.date).getTime() - target) <
        Math.abs(new Date(best.date).getTime() - target)
          ? o
          : best,
      );
      return closest.value;
    },
    [obsByIso, observations],
  );

  // Vertical layout for the numbered circles. Stack into 2 rows when adjacent
  // markers would overlap, so the labels remain readable.
  const CIRCLE_R = 11;
  const ROW_HEIGHT = 30;
  type Marker = {
    policy: PolicyFrontmatter;
    n: number;
    cx: number;
    row: number;
    valueY: number | null;
  };
  const markers: Marker[] = [];
  const rowEnds: number[] = [];
  ordered.forEach((policy, i) => {
    const cx = xScale(new Date(policy.startDate));
    let row = 0;
    while (true) {
      const end = rowEnds[row];
      if (end === undefined || end <= cx - CIRCLE_R * 2) break;
      row += 1;
    }
    rowEnds[row] = cx + CIRCLE_R * 2;
    const v = valueAt(policy.startDate);
    markers.push({
      policy,
      n: i + 1,
      cx,
      row,
      valueY: v == null ? null : yScale(v),
    });
  });

  return (
    <g>
      {markers.map(({ policy, n, cx, row, valueY }) => {
        const cy = 18 + row * ROW_HEIGHT;
        const dropTop = cy + CIRCLE_R;
        const HIT = CIRCLE_R + 6;
        return (
          <a
            key={policy.id}
            href={`?policy=${policy.id}`}
            aria-label={`${n}. ${policy.title}`}
            className="group cursor-pointer focus:outline-none"
            onClick={(e) => {
              e.preventDefault();
              onSelect(policy.id);
            }}
          >
            {valueY !== null && (
              <line
                x1={cx}
                x2={cx}
                y1={dropTop}
                y2={valueY - 4}
                strokeDasharray="2 3"
                className={`${KIND_STROKE[policy.kind]} opacity-60 pointer-events-none`}
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={CIRCLE_R}
              className={`fill-paper ${KIND_STROKE[policy.kind]} transition-[fill] group-hover:fill-paper-2 pointer-events-none`}
              strokeWidth={1.5}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              className={`${KIND_TEXT[policy.kind]} font-mono text-[11px] font-semibold pointer-events-none`}
            >
              {n}
            </text>
            {valueY !== null && (
              <circle
                cx={cx}
                cy={valueY}
                r={3.5}
                className={`${KIND_FILL[policy.kind]} stroke-paper pointer-events-none`}
                strokeWidth={1.5}
              />
            )}
            {/* Larger transparent hit target, on top of all visual elements.
                pointerEvents="all" is required because fill="transparent" is
                skipped by SVG's default "visiblePainted" hit-testing. */}
            <rect
              x={cx - HIT}
              y={cy - HIT}
              width={HIT * 2}
              height={HIT * 2}
              fill="transparent"
              pointerEvents="all"
            />
            <title>{`${n}. ${policy.title}`}</title>
          </a>
        );
      })}
      {/* Reserve the dimensions of the lane so other elements can layout against it.
          pointer-events:none is critical — without it this rect sits on top of
          every marker and silently eats clicks (SVG's default "visiblePainted"
          treats fill="transparent" as a valid hit target). */}
      <rect
        x={0}
        y={0}
        width={dims.width}
        height={dims.marginTop}
        className="pointer-events-none fill-transparent"
      />
    </g>
  );
}

export function PolicyLaneLegend() {
  const items: { kind: PolicyKind; label: string }[] = [
    { kind: "monetary", label: "Monetary" },
    { kind: "fiscal", label: "Fiscal" },
    { kind: "trade", label: "Trade" },
    { kind: "regulatory", label: "Regulatory" },
    { kind: "exogenous", label: "Exogenous" },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-5 font-sans text-[11px] text-ink-500">
      <li className="font-semibold uppercase tracking-[0.14em] text-ink-400">Event kinds</li>
      {items.map(({ kind, label }) => (
        <li key={kind} className="flex items-center gap-2">
          <span
            aria-hidden
            className={`inline-block h-2.5 w-2.5 ${KIND_FILL_CLASS[kind]}`}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}

const KIND_FILL_CLASS: Record<PolicyKind, string> = {
  monetary: "bg-policy-monetary",
  fiscal: "bg-policy-fiscal",
  trade: "bg-policy-trade",
  regulatory: "bg-policy-regulatory",
  exogenous: "bg-policy-exogenous",
};
