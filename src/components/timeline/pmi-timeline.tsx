"use client";

import * as React from "react";
import { line, area, curveMonotoneX } from "d3-shape";
import { TimelineProvider, useTimeline, type TimelineDimensions } from "./timeline-context";
import type { MonthlyObservation, RecessionPeriod } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";

export interface PMITimelineProps {
  observations: readonly MonthlyObservation[];
  recessions: readonly RecessionPeriod[];
  /** Optional max date — anything after is hidden (Fed Chair era-lock). */
  maxDate?: Date;
  className?: string;
  /** Render children inside the SVG, on top of the PMI series. Use for the policy lane. */
  children?: React.ReactNode;
  /** Callback when the user hovers a month. */
  onHoverDate?: (iso: string | null) => void;
  /** Override chart dimensions (used for compact embeddings like fed-chair). */
  dims?: TimelineDimensions;
  /** Y-axis tick values. Defaults to PMI scale [30,40,50,60,70]. */
  yTicks?: readonly number[];
  /** Y-axis domain. Default [28, 72] (PMI scale). */
  yDomain?: [number, number];
  /** Threshold value where the expansion/contraction split is drawn. Default 50 (PMI). */
  threshold?: number;
  /** Suffix appended to tooltip values (e.g. "%"). Default "" (PMI is unitless). */
  valueSuffix?: string;
  /** Number of decimals to render in tooltip + axis labels. Default 1. */
  valueDecimals?: number;
  /**
   * Optional overlay of hand-curated PMI markers. Each plots at its month
   * with y = (value - 50) * markerScale, so PMI 50 sits on the chart's
   * expansion/contraction threshold.
   */
  pmiMarkers?: readonly { date: string; value: number; sourceUrl: string }[];
  /** Multiplier applied to (value - 50) when positioning markers. Default 1.5. */
  pmiMarkerScale?: number;
  /**
   * Optional second series — typically the ISM Services PMI (NMI). Rendered
   * as a teal dashed line, threshold-relative (y = (value - 50) * scale) so
   * it overlays cleanly on either a PMI-scale chart (where it appears around
   * the 50-line) or an INDPRO-Y/Y chart (where it tracks the
   * expansion/contraction threshold). Line is broken at gaps >3 months so
   * the structural Wayback gap doesn't visually interpolate.
   */
  nmiObservations?: readonly MonthlyObservation[];
  /** Multiplier applied to (value - 50) when positioning the NMI line. Default 1.5. */
  nmiScale?: number;
  /**
   * If set, splits the primary series line + area at gaps larger than this many
   * months so structural data gaps (e.g. the 2015-04 → 2020-06 Wayback gap for
   * Services) don't visually interpolate across the missing window.
   */
  breakAtGapMonths?: number;
}

const DEFAULT_DIMS: TimelineDimensions = {
  width: 1200,
  height: 480,
  chartHeight: 480,
  marginLeft: 48,
  marginRight: 24,
  marginTop: 100,
  marginBottom: 28,
};

const DEFAULT_Y_TICKS = [30, 40, 50, 60, 70] as const;

/**
 * Master PMI timeline. Renders the full series since 1948 with:
 *   • 50-line threshold (expansion / contraction)
 *   • NBER recession bands shaded behind the line
 *   • Subtle red/green area fill below/above the threshold
 *   • Hover crosshair + tooltip
 *
 * Embed children to render the policy lane synced to the same x-scale.
 */
export function PMITimeline({
  observations,
  recessions,
  maxDate,
  className,
  children,
  onHoverDate,
  dims,
  yTicks = DEFAULT_Y_TICKS,
  yDomain,
  threshold = 50,
  valueSuffix = "",
  valueDecimals = 1,
  pmiMarkers,
  pmiMarkerScale = 1.5,
  nmiObservations,
  nmiScale = 1.5,
  breakAtGapMonths,
}: PMITimelineProps) {
  const data = React.useMemo(() => {
    const all = observations.map((o) => ({ date: new Date(o.date), value: o.value, iso: o.date }));
    if (!maxDate) return all;
    return all.filter((d) => d.date <= maxDate);
  }, [observations, maxDate]);

  const nmiData = React.useMemo(() => {
    if (!nmiObservations) return null;
    const all = nmiObservations.map((o) => ({
      date: new Date(o.date),
      value: o.value,
      iso: o.date,
    }));
    if (!maxDate) return all;
    return all.filter((d) => d.date <= maxDate);
  }, [nmiObservations, maxDate]);

  const domainStart = data[0]?.date ?? new Date("1948-01-01");
  const domainEnd = data[data.length - 1]?.date ?? new Date();
  const resolvedDims = dims ?? DEFAULT_DIMS;

  return (
    <TimelineProvider
      domainStart={domainStart}
      domainEnd={domainEnd}
      yDomain={yDomain}
      dims={resolvedDims}
    >
      <div className={cn("relative", className)}>
        <svg
          viewBox={`0 0 ${resolvedDims.width} ${resolvedDims.height}`}
          className="w-full"
          role="img"
          aria-label={`Manufacturing series from ${domainStart.getFullYear()} to present, with recession bands and an expansion/contraction threshold at ${threshold}`}
        >
          <RecessionBands recessions={recessions} />
          <YGridLines yTicks={yTicks} />
          <SeriesArea data={data} threshold={threshold} breakAtGapMonths={breakAtGapMonths} />
          <ThresholdLine threshold={threshold} />
          <SeriesLine data={data} breakAtGapMonths={breakAtGapMonths} />
          {nmiData && nmiData.length > 0 && <NMISeriesLine data={nmiData} scale={nmiScale} />}
          {pmiMarkers && pmiMarkers.length > 0 && (
            <PMIMarkers markers={pmiMarkers} scale={pmiMarkerScale} />
          )}
          <Axes yTicks={yTicks} valueDecimals={valueDecimals} />
          <HoverLayer data={data} onHoverDate={onHoverDate} />
          {children}
        </svg>
        <Tooltip data={data} valueSuffix={valueSuffix} valueDecimals={valueDecimals} />
      </div>
    </TimelineProvider>
  );
}

// ---------------------- internal pieces ----------------------

function YGridLines({ yTicks }: { yTicks: readonly number[] }) {
  const { yScale, dims } = useTimeline();
  return (
    <g aria-hidden>
      {yTicks.map((v) => (
        <line
          key={v}
          x1={dims.marginLeft}
          x2={dims.width - dims.marginRight}
          y1={yScale(v)}
          y2={yScale(v)}
          className="stroke-paper-edge"
          strokeDasharray="2 4"
        />
      ))}
    </g>
  );
}

function Axes({ yTicks, valueDecimals }: { yTicks: readonly number[]; valueDecimals: number }) {
  const { xScale, yScale, dims } = useTimeline();

  // X-axis ticks every 5 years across the domain, full 4-digit years.
  const [start, end] = xScale.domain() as [Date, Date];
  const startYear = Math.ceil(start.getFullYear() / 5) * 5;
  const endYear = end.getFullYear();
  const xTicks: { x: number; label: string }[] = [];
  for (let y = startYear; y <= endYear; y += 5) {
    const x = xScale(new Date(`${y}-01-01`));
    if (x < dims.marginLeft || x > dims.width - dims.marginRight) continue;
    xTicks.push({ x, label: String(y) });
  }

  return (
    <>
      <g aria-hidden>
        {yTicks.map((v) => (
          <text
            key={v}
            x={dims.marginLeft - 10}
            y={yScale(v)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-ink-400 font-mono text-[11px]"
          >
            {Number.isInteger(v) ? v : v.toFixed(valueDecimals)}
          </text>
        ))}
      </g>
      <g aria-hidden>
        {xTicks.map((t) => (
          <text
            key={t.label + t.x}
            x={t.x}
            y={dims.chartHeight - 8}
            textAnchor="middle"
            className="fill-ink-400 font-mono text-[11px]"
          >
            {t.label}
          </text>
        ))}
      </g>
    </>
  );
}

function ThresholdLine({ threshold }: { threshold: number }) {
  const { yScale, dims } = useTimeline();
  const y = yScale(threshold);
  return (
    <line
      x1={dims.marginLeft}
      x2={dims.width - dims.marginRight}
      y1={y}
      y2={y}
      className="stroke-ink-700"
      strokeWidth={0.75}
    />
  );
}

function RecessionBands({ recessions }: { recessions: readonly RecessionPeriod[] }) {
  const { xScale, dims } = useTimeline();
  return (
    <g>
      {recessions.map((r) => {
        const x1 = xScale(new Date(r.peak));
        const x2 = xScale(new Date(r.trough));
        return (
          <rect
            key={`${r.peak}-${r.trough}`}
            x={x1}
            y={dims.marginTop}
            width={Math.max(2, x2 - x1)}
            height={dims.chartHeight - dims.marginTop - dims.marginBottom}
            className="fill-paper-edge/45"
          />
        );
      })}
    </g>
  );
}

interface DataPoint {
  date: Date;
  value: number;
  iso: string;
}

function splitAtGaps(data: DataPoint[], gapMonths: number | undefined): DataPoint[][] {
  if (gapMonths === undefined || data.length === 0) return [data];
  const result: DataPoint[][] = [];
  let current: DataPoint[] = [];
  for (let i = 0; i < data.length; i += 1) {
    const point = data[i]!;
    const prev = data[i - 1];
    if (prev) {
      const gap =
        (point.date.getFullYear() - prev.date.getFullYear()) * 12 +
        (point.date.getMonth() - prev.date.getMonth());
      if (gap > gapMonths) {
        if (current.length) result.push(current);
        current = [];
      }
    }
    current.push(point);
  }
  if (current.length) result.push(current);
  return result;
}

function SeriesArea({
  data,
  threshold,
  breakAtGapMonths,
}: {
  data: DataPoint[];
  threshold: number;
  breakAtGapMonths?: number;
}) {
  const { xScale, yScale } = useTimeline();
  const baseline = yScale(threshold);
  const segments = React.useMemo(
    () => splitAtGaps(data, breakAtGapMonths),
    [data, breakAtGapMonths],
  );

  const aboveGen = React.useMemo(
    () =>
      area<DataPoint>()
        .x((d) => xScale(d.date))
        .y0(baseline)
        .y1((d) => yScale(Math.max(d.value, threshold)))
        .curve(curveMonotoneX),
    [xScale, yScale, baseline, threshold],
  );

  const belowGen = React.useMemo(
    () =>
      area<DataPoint>()
        .x((d) => xScale(d.date))
        .y0(baseline)
        .y1((d) => yScale(Math.min(d.value, threshold)))
        .curve(curveMonotoneX),
    [xScale, yScale, baseline, threshold],
  );

  return (
    <g>
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          <path d={aboveGen(seg) ?? ""} className="fill-ink-200/25" />
          <path d={belowGen(seg) ?? ""} className="fill-oxblood/10" />
        </React.Fragment>
      ))}
    </g>
  );
}

function SeriesLine({
  data,
  breakAtGapMonths,
}: {
  data: DataPoint[];
  breakAtGapMonths?: number;
}) {
  const { xScale, yScale } = useTimeline();
  const segments = React.useMemo(
    () => splitAtGaps(data, breakAtGapMonths),
    [data, breakAtGapMonths],
  );
  const lineGen = React.useMemo(
    () =>
      line<DataPoint>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.value))
        .curve(curveMonotoneX),
    [xScale, yScale],
  );
  return (
    <g>
      {segments.map((seg, i) => (
        <path
          key={i}
          d={lineGen(seg) ?? ""}
          className="fill-none stroke-ink-700"
          strokeWidth={1.25}
        />
      ))}
    </g>
  );
}

/**
 * Secondary series (e.g. ISM Services PMI / NMI) overlaid threshold-relative.
 * y = yScale((value - 50) * scale) — so NMI 50 plots on the chart's
 * expansion/contraction threshold regardless of whether the chart's primary
 * y-axis is PMI-scale (28-72) or INDPRO Y/Y % (-32 to 32). Splits at gaps
 * >3 months so the structural Wayback gap (2015-04 → 2020-06 for Services)
 * doesn't visually interpolate. Rendered teal dashed to distinguish from
 * the primary line.
 */
function NMISeriesLine({ data, scale }: { data: DataPoint[]; scale: number }) {
  const { xScale, yScale } = useTimeline();
  const segments = React.useMemo(() => {
    const result: DataPoint[][] = [];
    let current: DataPoint[] = [];
    for (let i = 0; i < data.length; i += 1) {
      const point = data[i]!;
      const prev = data[i - 1];
      if (prev) {
        const gap =
          (point.date.getFullYear() - prev.date.getFullYear()) * 12 +
          (point.date.getMonth() - prev.date.getMonth());
        if (gap > 3) {
          if (current.length) result.push(current);
          current = [];
        }
      }
      current.push(point);
    }
    if (current.length) result.push(current);
    return result;
  }, [data]);

  const lineGen = React.useMemo(
    () =>
      line<DataPoint>()
        .x((d) => xScale(d.date))
        .y((d) => yScale((d.value - 50) * scale))
        .curve(curveMonotoneX),
    [xScale, yScale, scale],
  );

  return (
    <g aria-label="ISM Services PMI overlay">
      {segments.map((seg, i) => (
        <path
          key={i}
          d={lineGen(seg) ?? ""}
          className="fill-none stroke-teal"
          strokeWidth={1.25}
          strokeDasharray="5 3"
        />
      ))}
    </g>
  );
}

function PMIMarkers({
  markers,
  scale,
}: {
  markers: readonly { date: string; value: number; sourceUrl: string }[];
  scale: number;
}) {
  const { xScale, yScale } = useTimeline();
  const monthLabel = (iso: string) => {
    const [y, m] = iso.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[Number(m) - 1] ?? m} ${y}`;
  };
  return (
    <g aria-label="ISM PMI hand-curated markers">
      {markers.map((m) => {
        const x = xScale(new Date(m.date));
        const y = yScale((m.value - 50) * scale);
        const label = `ISM PMI ${m.value.toFixed(1)} · ${monthLabel(m.date)} · open ISM source`;
        return (
          <a
            key={m.date}
            href={m.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="cursor-pointer focus:outline-none"
          >
            {/* Larger transparent hit target so the dot is easy to click. */}
            <circle cx={x} cy={y} r={10} className="fill-transparent" />
            <circle
              cx={x}
              cy={y}
              r={4}
              className="fill-accent stroke-paper transition-[r] hover:[r:5]"
              strokeWidth={1.5}
            />
            <text
              x={x}
              y={y - 8}
              textAnchor="middle"
              className="fill-accent-dark font-mono text-[9px] pointer-events-none"
            >
              {m.value.toFixed(1)}
            </text>
            <title>{label}</title>
          </a>
        );
      })}
    </g>
  );
}

function HoverLayer({
  data,
  onHoverDate,
}: {
  data: DataPoint[];
  onHoverDate?: (iso: string | null) => void;
}) {
  const { xScale, dims, hoveredDate, setHoveredDate, yScale } = useTimeline();

  const handleMove = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // The rect lives in viewBox space (x = dims.marginLeft, width = inner chart width),
    // but getBoundingClientRect gives us DOM pixels. Convert DOM-space cursor offset back
    // into viewBox space before inverting the time scale.
    const innerViewBoxWidth = dims.width - dims.marginLeft - dims.marginRight;
    const pxFromInnerLeft = ((event.clientX - rect.left) / rect.width) * innerViewBoxWidth;
    const date = xScale.invert(dims.marginLeft + pxFromInnerLeft);
    // Snap to nearest month
    const target = data.reduce<DataPoint | null>((closest, d) => {
      if (!closest) return d;
      return Math.abs(d.date.getTime() - date.getTime()) <
        Math.abs(closest.date.getTime() - date.getTime())
        ? d
        : closest;
    }, null);
    if (target) {
      setHoveredDate(target.iso);
      onHoverDate?.(target.iso);
    }
  };

  const handleLeave = () => {
    setHoveredDate(null);
    onHoverDate?.(null);
  };

  const hoveredPoint = data.find((d) => d.iso === hoveredDate);

  return (
    <g>
      {hoveredPoint && (
        <>
          <line
            x1={xScale(hoveredPoint.date)}
            x2={xScale(hoveredPoint.date)}
            y1={dims.marginTop}
            y2={dims.chartHeight - dims.marginBottom}
            className="stroke-accent/60"
            strokeDasharray="2 3"
          />
          <circle
            cx={xScale(hoveredPoint.date)}
            cy={yScale(hoveredPoint.value)}
            r={4}
            className="fill-accent stroke-paper"
            strokeWidth={2}
          />
        </>
      )}
      <rect
        x={dims.marginLeft}
        y={dims.marginTop}
        width={dims.width - dims.marginLeft - dims.marginRight}
        height={dims.chartHeight - dims.marginTop - dims.marginBottom}
        fill="transparent"
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      />
    </g>
  );
}

function Tooltip({
  data,
  valueSuffix,
  valueDecimals,
}: {
  data: DataPoint[];
  valueSuffix: string;
  valueDecimals: number;
}) {
  const { hoveredDate, xScale, dims } = useTimeline();
  const point = data.find((d) => d.iso === hoveredDate);
  if (!point) return null;
  // Position the tooltip in document coords, anchored to the SVG viewBox proportionally.
  const xPercent = (xScale(point.date) / dims.width) * 100;
  const isLeftHalf = xPercent < 50;
  return (
    <div
      className="pointer-events-none absolute top-3 z-10 min-w-[130px] bg-ink-700 px-3 py-2 font-mono text-[11px] leading-[1.5] text-paper"
      style={{ [isLeftHalf ? "left" : "right"]: `${isLeftHalf ? xPercent + 2 : 100 - xPercent + 2}%` }}
    >
      <div className="text-[10px] uppercase tracking-[0.06em] text-paper-2/80">
        {formatTooltipDate(point.iso)}
      </div>
      <div className="mt-0.5 text-[16px] text-paper">
        {point.value.toFixed(valueDecimals)}
        {valueSuffix}
      </div>
    </div>
  );
}

function formatTooltipDate(iso: string): string {
  const [y, m] = iso.split("-");
  if (!y || !m) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[Number(m) - 1] ?? m} ${y}`;
}
