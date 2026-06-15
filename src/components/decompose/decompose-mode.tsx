"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  type MonthlySeries,
  type RecessionPeriod,
} from "@/lib/data/schemas";
import { computeBlend, type Preset, type Weights } from "@/lib/decompose/blend";
import { recessionBacktest } from "@/lib/decompose/backtest";

export interface DecomposeModeProps {
  pmi: MonthlySeries;
  subindices: Record<string, MonthlySeries>;
  recessions: readonly RecessionPeriod[];
  /** Order of subindex names — drives the slider rendering order. */
  names: readonly string[];
  /** Display labels for each subindex name. */
  labels: Record<string, string>;
  /** Reset target — typically the ISM equal-weighted default. */
  defaultWeights: Weights;
  /** Preset buttons shown next to "Reset to ISM". */
  presets: readonly Preset[];
  /** localStorage key — needs to differ between report types so toggling
   * between Mfg and Services doesn't clobber custom blends. */
  storageKey: string;
  /** Headline series label for the chart legend ("ISM PMI", "ISM Services PMI"). */
  reportHeadlineLabel: string;
}

export function DecomposeMode({
  pmi,
  subindices,
  recessions,
  names,
  labels,
  defaultWeights,
  presets,
  storageKey,
  reportHeadlineLabel,
}: DecomposeModeProps) {
  // Always start from defaultWeights so SSR and the first client render
  // agree (no hydration mismatch). Re-hydrate from localStorage in an effect
  // *after* mount, then begin persisting on subsequent changes.
  const [weights, setWeights] = React.useState<Weights>(defaultWeights);
  const [hydrated, setHydrated] = React.useState(false);

  // Reset weights when the report (and therefore defaultWeights/storageKey)
  // changes — otherwise the previous report's weights linger.
  React.useEffect(() => {
    setWeights(defaultWeights);
    setHydrated(false);
  }, [defaultWeights, storageKey]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object") {
          const merged: Weights = { ...defaultWeights };
          for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            if (typeof v === "number" && Number.isFinite(v)) merged[k] = v;
          }
          setWeights(merged);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, [storageKey, defaultWeights]);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(weights));
  }, [weights, hydrated, storageKey]);

  const blend = React.useMemo(() => computeBlend(subindices, weights), [subindices, weights]);
  const backtest = React.useMemo(() => recessionBacktest(blend, recessions), [blend, recessions]);
  const ismBacktest = React.useMemo(
    () => recessionBacktest(computeBlend(subindices, defaultWeights), recessions),
    [subindices, recessions, defaultWeights],
  );

  const totalRaw = names.reduce((a, n) => a + (weights[n] ?? 0), 0);
  const totalPct = Math.round(totalRaw * 100);

  const setSliderValue = (name: string, percent: number) => {
    setWeights((prev) => ({ ...prev, [name]: percent / 100 }));
  };

  const applyPreset = (preset: Weights) => setWeights(preset);

  const componentCountWord =
    names.length === 5 ? "five" : names.length === 4 ? "four" : `${names.length}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Subindex weights</CardTitle>
            <CardDescription>
              The headline {reportHeadlineLabel} is an equal-weighted blend of these{" "}
              {componentCountWord}. Change the mix to explore.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {names.map((name) => {
              const value = Math.round((weights[name] ?? 0) * 100);
              return (
                <div key={name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-caption">
                    <label htmlFor={`weight-${name}`} className="font-medium text-ink-600">
                      {labels[name] ?? name}
                    </label>
                    <span className="font-mono text-ink-500">{value}%</span>
                  </div>
                  <Slider
                    id={`weight-${name}`}
                    min={0}
                    max={60}
                    step={1}
                    value={[value]}
                    onValueChange={([v]) => v !== undefined && setSliderValue(name, v)}
                  />
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-caption">
              <span>Total</span>
              <span
                className={`font-mono ${totalPct === 100 ? "text-ink-500" : "text-contraction"}`}
              >
                {totalPct}%
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => applyPreset(defaultWeights)}>
                Reset to ISM
              </Button>
              {presets.slice(1).map((preset) => (
                <Button
                  key={preset.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => applyPreset(preset.weights)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recession-prediction backtest</CardTitle>
            <CardDescription>
              How often did your blend dip below 50 in the 6 months before an NBER recession?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {backtest.evaluable === 0 ? (
              <>
                <div className="font-serif text-display-2 text-ink-400">—</div>
                <div className="text-caption text-ink-500">
                  No recession in this dataset window has data points in its 6-month pre-window.
                  ({backtest.recessions}{" "}recession{backtest.recessions === 1 ? "" : "s"}{" "}in the
                  date range, but Wayback&apos;s 2015-04 → 2020-05 gap straddles the only one in
                  reach: COVID, Feb 2020.)
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-3">
                  <div className="font-serif text-display-2 text-ink-700">
                    {Math.round(backtest.hitRate * 100)}%
                  </div>
                  <div className="text-caption text-ink-400">
                    {backtest.hits}{" "}of {backtest.evaluable}{" "}evaluable recession
                    {backtest.evaluable === 1 ? "" : "s"}{" "}caught
                  </div>
                </div>
                {backtest.recessions > backtest.evaluable && (
                  <div className="text-caption text-ink-400">
                    {backtest.recessions - backtest.evaluable} unevaluable (no pre-window data)
                  </div>
                )}
                <div className="text-caption text-ink-500">
                  ISM default weights: {Math.round(ismBacktest.hitRate * 100)}% (
                  {ismBacktest.hits}/{ismBacktest.evaluable})
                </div>
              </>
            )}
            <p className="text-caption text-ink-400">
              The blend is a leading indicator, not a causal model. Below-50 readings can occur
              outside recession windows (false positives this dataset: {backtest.falsePositiveCount}
              ). Use this as a teaching aid, not a forecasting tool.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Custom blend vs. actual {reportHeadlineLabel}</CardTitle>
            <CardDescription>
              {pmi.observations.length} months · {pmi.observations[0]?.date} →{" "}
              {pmi.observations[pmi.observations.length - 1]?.date}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BlendChart
              pmi={pmi.observations}
              blend={blend}
              recessions={recessions}
              actualLabel={`Actual ${reportHeadlineLabel}`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface BlendChartProps {
  pmi: readonly MonthlySeries["observations"][number][];
  blend: readonly MonthlySeries["observations"][number][];
  recessions: readonly RecessionPeriod[];
  actualLabel: string;
}

function BlendChart({ pmi, blend, recessions, actualLabel }: BlendChartProps) {
  const width = 1100;
  const height = 380;
  const margin = { top: 16, right: 24, bottom: 28, left: 48 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const dates = pmi.map((p) => new Date(p.date).getTime());
  const xMin = Math.min(...dates);
  const xMax = Math.max(...dates);
  const yMin = 28;
  const yMax = 72;

  const xScale = (t: number) => margin.left + ((t - xMin) / (xMax - xMin)) * innerW;
  const yScale = (v: number) => margin.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const pmiPath = pathFromSeries(pmi, xScale, yScale);
  const blendPath = pathFromSeries(blend, xScale, yScale);

  const yearTicks: number[] = [];
  const startYear = new Date(xMin).getFullYear();
  const endYear = new Date(xMax).getFullYear();
  for (let y = Math.ceil(startYear / 10) * 10; y <= endYear; y += 10) yearTicks.push(y);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label={`Custom-weighted blend overlaid on the actual ${actualLabel}`}
    >
      {recessions.map((r) => {
        const x1 = xScale(new Date(r.peak).getTime());
        const x2 = xScale(new Date(r.trough).getTime());
        return (
          <rect
            key={r.peak}
            x={x1}
            y={margin.top}
            width={Math.max(2, x2 - x1)}
            height={innerH}
            className="fill-ink-200/40"
          />
        );
      })}
      <line
        x1={margin.left}
        x2={width - margin.right}
        y1={yScale(50)}
        y2={yScale(50)}
        className="stroke-ink-300"
        strokeDasharray="4 4"
      />
      {yearTicks.map((y) => {
        const x = xScale(new Date(`${y}-01-01`).getTime());
        return (
          <g key={y}>
            <line
              x1={x}
              x2={x}
              y1={margin.top}
              y2={height - margin.bottom}
              className="stroke-ink-100"
            />
            <text
              x={x}
              y={height - margin.bottom + 14}
              textAnchor="middle"
              className="fill-ink-400 text-[11px]"
            >
              {y}
            </text>
          </g>
        );
      })}
      {[30, 40, 50, 60, 70].map((v) => (
        <text
          key={v}
          x={margin.left - 8}
          y={yScale(v)}
          textAnchor="end"
          alignmentBaseline="middle"
          className="fill-ink-400 text-[11px]"
        >
          {v}
        </text>
      ))}
      <path d={pmiPath} className="fill-none stroke-ink-700" strokeWidth={1.4} />
      <path d={blendPath} className="fill-none stroke-accent" strokeWidth={1.4} strokeDasharray="6 3" />
      <g transform={`translate(${width - margin.right - 240}, ${margin.top + 4})`}>
        <rect width={240} height={48} rx={4} className="fill-paper opacity-90" />
        <line x1={12} x2={32} y1={20} y2={20} className="stroke-ink-700" strokeWidth={1.4} />
        <text x={40} y={23} className="fill-ink-600 text-[12px]">{actualLabel}</text>
        <line x1={12} x2={32} y1={36} y2={36} className="stroke-accent" strokeWidth={1.4} strokeDasharray="6 3" />
        <text x={40} y={39} className="fill-ink-600 text-[12px]">Your blend</text>
      </g>
    </svg>
  );
}

function pathFromSeries(
  series: readonly { date: string; value: number }[],
  xScale: (t: number) => number,
  yScale: (v: number) => number,
): string {
  // Break the line whenever consecutive observations are >3 months apart so
  // the chart doesn't visually interpolate across the structural 2015-2020
  // Wayback gap. M(oveTo) restarts a subpath; L(ineTo) continues it.
  const cmds: string[] = [];
  let prev: { date: string; value: number } | null = null;
  for (const o of series) {
    const x = xScale(new Date(o.date).getTime()).toFixed(1);
    const y = yScale(o.value).toFixed(1);
    const gap = prev ? monthsBetween(prev.date, o.date) : Infinity;
    cmds.push(`${gap > 3 ? "M" : "L"}${x} ${y}`);
    prev = o;
  }
  return cmds.join(" ");
}

function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by! - ay!) * 12 + (bm! - am!);
}
