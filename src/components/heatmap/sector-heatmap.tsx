"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { sectorProvenanceLabels, type SectorsFile, type SectorCell } from "@/lib/data/sectors";
import { RegimeChip } from "@/components/background/regime-chip";
import { chairSurname, getRegimeChair } from "@/lib/background/lookup";

export interface SectorHeatmapProps {
  data: SectorsFile;
}

export function SectorHeatmap({ data }: SectorHeatmapProps) {
  const [active, setActive] = React.useState<SectorCell | null>(null);
  const cellLookup = React.useMemo(() => {
    const m = new Map<string, SectorCell>();
    for (const c of data.cells) m.set(`${c.industry}__${c.regime}`, c);
    return m;
  }, [data.cells]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardContent className="space-y-3 px-5 py-5">
            <h3 className="font-serif text-title-2 text-ink-700">Color scale</h3>
            <div className="space-y-2 text-caption text-ink-500">
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-contraction via-ink-200 to-expansion" />
              <div className="flex justify-between text-[11px] text-ink-400">
                <span>-100 contraction</span>
                <span>0 mixed</span>
                <span>+100 expansion</span>
              </div>
            </div>
            <p className="text-caption text-ink-400">
              Score is net expansion vs. contraction frequency for an industry across a regime.
              Pandemic-regime cells are computed from primary ISM monthly reports (Wayback
              archive); earlier regimes are editorial estimates. The provenance badge in the
              detail card distinguishes the two.
            </p>
          </CardContent>
        </Card>

        {active && (
          <Card>
            <CardContent className="space-y-2 px-5 py-5">
              <p className="text-caption uppercase tracking-wider text-accent-dark">
                {data.regimes.find((r) => r.id === active.regime)?.label}
              </p>
              <h3 className="font-serif text-title-2 text-ink-700">{active.industry}</h3>
              <p className="font-mono text-caption text-ink-400">
                Score {active.score >= 0 ? "+" : ""}
                {active.score}
              </p>
              <p className="text-body text-ink-600">{active.narrative}</p>
              <p className="text-[11px] text-ink-400">
                <span
                  className={`inline-flex items-center rounded-sm px-1.5 py-0.5 font-sans uppercase tracking-wider ${
                    active.provenance === "hand-estimate"
                      ? "bg-accent-dark/15 text-accent-dark"
                      : "bg-ink-100 text-ink-500"
                  }`}
                >
                  {sectorProvenanceLabels[active.provenance]}
                </span>
                {active.sourceUrl && (
                  <a
                    href={active.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 underline hover:text-ink-700"
                  >
                    source
                  </a>
                )}
              </p>
            </CardContent>
          </Card>
        )}
      </aside>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-caption">
          <thead>
            <tr>
              <th className="sticky left-0 bg-paper text-left text-caption font-medium text-ink-400">
                Industry
              </th>
              {data.regimes.map((regime) => {
                const chair = getRegimeChair(regime.id);
                return (
                  <th
                    key={regime.id}
                    className="px-2 pb-2 text-left text-caption text-ink-500"
                    scope="col"
                  >
                    {chair && (
                      <div className="mb-1.5">
                        <RegimeChip entry={chair} chairLabel={chairSurname(chair)} />
                      </div>
                    )}
                    <div className="font-medium text-ink-600">{regime.label}</div>
                    <div className="text-[11px] text-ink-400">{regime.range}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.industries.map((industry) => (
              <tr key={industry}>
                <th
                  className="sticky left-0 bg-paper py-1 pr-3 text-left text-caption font-medium text-ink-600"
                  scope="row"
                >
                  {industry}
                </th>
                {data.regimes.map((regime) => {
                  const cell = cellLookup.get(`${industry}__${regime.id}`);
                  return (
                    <td key={regime.id} className="p-0">
                      <HeatmapCell cell={cell} onSelect={setActive} active={active === cell} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeatmapCell({
  cell,
  onSelect,
  active,
}: {
  cell: SectorCell | undefined;
  onSelect: (cell: SectorCell) => void;
  active: boolean;
}) {
  if (!cell) return <div className="h-9 rounded-sm border border-dashed border-ink-100" />;
  const tone = scoreToTone(cell.score);
  return (
    <button
      type="button"
      onClick={() => onSelect(cell)}
      className={`flex h-9 w-full items-center justify-center rounded-sm text-[11px] font-mono transition-shadow ${tone} ${
        active ? "ring-2 ring-accent ring-offset-1 ring-offset-paper" : "hover:ring-1 hover:ring-accent/60"
      }`}
      title={`${cell.industry} — ${cell.narrative}`}
    >
      {cell.score >= 0 ? "+" : ""}
      {cell.score}
    </button>
  );
}

function scoreToTone(score: number): string {
  // Map score [-100, +100] to one of 7 buckets for color stability across cells.
  if (score <= -50) return "bg-contraction text-paper";
  if (score <= -20) return "bg-contraction/60 text-paper";
  if (score <= -5) return "bg-contraction/30 text-ink-700";
  if (score < 5) return "bg-ink-100 text-ink-500";
  if (score < 20) return "bg-expansion/30 text-ink-700";
  if (score < 50) return "bg-expansion/60 text-paper";
  return "bg-expansion text-paper";
}
