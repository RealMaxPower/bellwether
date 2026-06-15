import Link from "next/link";
import { line, curveMonotoneX } from "d3-shape";
import { scaleLinear, scaleTime } from "d3-scale";
import { extent } from "d3-array";
import {
  provenanceLabels,
  type CuratedSeries,
  type MonthlySeries,
  type RecessionsFile,
} from "@/lib/data/schemas";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtMonth(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1] ?? m} ${y}`;
}

function fmtPct(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by! - ay!) * 12 + (bm! - am!);
}

export interface CurrentStatePanelProps {
  /** Merged Manufacturing PMI series, used for the headline value + the sparkline. */
  pmi: CuratedSeries;
  /** Merged Services PMI / NMI series. Optional — omitted before NMI data is wired. */
  nmi?: CuratedSeries;
  /** INDPRO Y/Y series, used for the second value + best/worst footer cells. */
  indpro: MonthlySeries;
  /** NBER recession periods, used for the recession-count footer cell. */
  recessions: RecessionsFile;
}

/**
 * Single horizontal panel that answers "what is the economy doing right
 * now?" — replaces the old INDPRO StatCell strip and PMISnapshot, which
 * duplicated each other conceptually. PMI value on the left, INDPRO Y/Y
 * in the middle, sparkline on the right; secondary stats in a thin footer
 * row underneath.
 */
export function CurrentStatePanel({ pmi, nmi, indpro, recessions }: CurrentStatePanelProps) {
  const pmiObs = pmi.observations;
  const pmiLatest = pmiObs[pmiObs.length - 1]!;
  const pmiPrior = pmiObs.length >= 2 ? pmiObs[pmiObs.length - 2]! : null;
  const pmiPriorAdjacent = pmiPrior && monthsBetween(pmiPrior.date, pmiLatest.date) === 1;
  const pmiDelta = pmiPrior ? pmiLatest.value - pmiPrior.value : null;
  const pmiAbove = pmiLatest.value >= 50;
  const pmiSourceLabel = pmiLatest.sourceUrl.includes("ismworld")
    ? "ISM source"
    : pmiLatest.sourceUrl.includes("web.archive.org")
      ? "Wayback source"
      : "Source";

  const nmiObs = nmi?.observations ?? [];
  const nmiLatest = nmiObs.length > 0 ? nmiObs[nmiObs.length - 1]! : null;
  const nmiPrior = nmiObs.length >= 2 ? nmiObs[nmiObs.length - 2]! : null;
  const nmiPriorAdjacent =
    nmiLatest && nmiPrior && monthsBetween(nmiPrior.date, nmiLatest.date) === 1;
  const nmiDelta = nmiLatest && nmiPrior ? nmiLatest.value - nmiPrior.value : null;
  const nmiAbove = nmiLatest ? nmiLatest.value >= 50 : false;
  const nmiSourceLabel = nmiLatest?.sourceUrl.includes("ismworld")
    ? "ISM source"
    : "Wayback source";

  const indObs = indpro.observations;
  const indLatest = indObs[indObs.length - 1]!;
  const indPrior = indObs.length >= 2 ? indObs[indObs.length - 2]! : null;
  const indDelta = indPrior ? indLatest.value - indPrior.value : null;
  const indAbove = indLatest.value >= 0;

  const indHigh = indObs.reduce((a, b) => (b.value > a.value ? b : a));
  const indLow = indObs.reduce((a, b) => (b.value < a.value ? b : a));

  const lastRecession = recessions.periods[recessions.periods.length - 1] ?? null;

  return (
    <div className="border border-ink-700 bg-paper">
      {/* Single unified grid: stat blocks (row 1) + footer cells (row 2)
          share the same column tracks, and the sparkline spans both rows so
          the vertical dividers line up cleanly across the panel. */}
      <div
        className={`grid grid-cols-1 gap-px bg-ink-700 ${
          nmiLatest ? "md:grid-cols-4" : "md:grid-cols-3"
        }`}
      >
        <StatBlock
          eyebrow={`ISM Manufacturing PMI · ${fmtMonth(pmiLatest.date)}`}
          value={pmiLatest.value.toFixed(1)}
          state={pmiAbove ? "expansion" : "contraction"}
          delta={
            pmiDelta !== null && pmiPrior
              ? {
                  value: Math.abs(pmiDelta).toFixed(1),
                  direction: pmiDelta >= 0 ? "up" : "down",
                  label: pmiPriorAdjacent ? "vs prior month" : `since ${fmtMonth(pmiPrior.date)}`,
                }
              : null
          }
          source={{ url: pmiLatest.sourceUrl, label: pmiSourceLabel }}
        />
        {nmiLatest && (
          <StatBlock
            eyebrow={`ISM Services PMI · ${fmtMonth(nmiLatest.date)}`}
            value={nmiLatest.value.toFixed(1)}
            state={nmiAbove ? "expansion" : "contraction"}
            delta={
              nmiDelta !== null && nmiPrior
                ? {
                    value: Math.abs(nmiDelta).toFixed(1),
                    direction: nmiDelta >= 0 ? "up" : "down",
                    label: nmiPriorAdjacent
                      ? "vs prior month"
                      : `since ${fmtMonth(nmiPrior.date)}`,
                  }
                : null
            }
            source={{ url: nmiLatest.sourceUrl, label: nmiSourceLabel }}
          />
        )}
        <StatBlock
          eyebrow={`INDPRO Y/Y · ${fmtMonth(indLatest.date)}`}
          value={fmtPct(indLatest.value)}
          state={indAbove ? "expansion" : "contraction"}
          delta={
            indDelta !== null
              ? {
                  value: `${Math.abs(indDelta).toFixed(2)} pp`,
                  direction: indDelta >= 0 ? "up" : "down",
                  label: "vs prior month",
                }
              : null
          }
          source={null}
        />
        <div
          className={`flex items-center justify-center bg-paper-2 px-4 py-5 ${
            nmiLatest ? "md:row-span-2" : ""
          }`}
        >
          <Sparkline observations={pmiObs} />
        </div>
        <FooterCell
          label="Best Y/Y"
          value={fmtPct(indHigh.value)}
          detail={fmtMonth(indHigh.date)}
          tone="teal"
        />
        <FooterCell
          label="Worst Y/Y"
          value={fmtPct(indLow.value)}
          detail={fmtMonth(indLow.date)}
          tone="oxblood"
        />
        <FooterCell
          label="NBER recessions in coverage"
          value={String(recessions.periods.length)}
          detail={
            lastRecession
              ? `Last: ${fmtMonth(lastRecession.peak)} → ${fmtMonth(lastRecession.trough)}`
              : "—"
          }
          tone="ink"
        />
      </div>

      {/* Source row */}
      <p className="flex flex-wrap items-center justify-between gap-2 border-t border-paper-edge bg-paper-2/40 px-6 py-2 font-sans text-[10px] uppercase tracking-[0.08em] text-ink-400">
        <span>
          INDPRO · {provenanceLabels[indpro.provenance]} · last verified {indpro.lastVerifiedAt}
        </span>
        <Link href="/about-the-data" className="underline hover:text-ink-700">
          How accurate is this?
        </Link>
      </p>
    </div>
  );
}

interface StatBlockProps {
  eyebrow: string;
  value: string;
  state: "expansion" | "contraction";
  delta: { value: string; direction: "up" | "down"; label: string } | null;
  source: { url: string; label: string } | null;
}

function StatBlock({ eyebrow, value, state, delta, source }: StatBlockProps) {
  const stateColor = state === "expansion" ? "text-teal" : "text-oxblood";
  return (
    <div className="bg-paper px-6 py-5">
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
        {eyebrow}
      </p>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-mono text-[36px] font-medium leading-none text-ink-700">
          {value}
        </span>
        <span className={`font-mono text-[12px] capitalize ${stateColor}`}>{state}</span>
      </div>
      {delta && (
        <p className="mt-1.5 font-mono text-[11px] text-ink-400">
          {delta.direction === "up" ? "▲" : "▼"} {delta.value} {delta.label}
        </p>
      )}
      {source && (
        <p className="mt-1 font-mono text-[11px] text-ink-400">
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-ink-700"
          >
            {source.label}
          </a>
        </p>
      )}
    </div>
  );
}

function FooterCell({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "teal" | "oxblood" | "ink";
}) {
  const valueColor =
    tone === "teal" ? "text-teal" : tone === "oxblood" ? "text-oxblood" : "text-ink-700";
  return (
    <div className="bg-paper px-5 py-3">
      <div className="font-sans text-[9px] font-medium uppercase tracking-[0.12em] text-ink-400">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className={`font-mono text-[15px] font-medium ${valueColor}`}>{value}</span>
        <span className="font-mono text-[10px] text-ink-400">{detail}</span>
      </div>
    </div>
  );
}

function Sparkline({ observations }: { observations: CuratedSeries["observations"] }) {
  const data = observations.map((o) => ({ date: new Date(o.date), value: o.value }));
  const W = 360;
  const H = 110;
  const M = { l: 6, r: 6, t: 10, b: 14 };

  const xExt = extent(data, (d) => d.date) as [Date, Date];
  const xs = scaleTime().domain(xExt).range([M.l, W - M.r]);
  const yMin = Math.min(28, Math.min(...data.map((d) => d.value)) - 2);
  const yMax = Math.max(70, Math.max(...data.map((d) => d.value)) + 2);
  const ys = scaleLinear().domain([yMin, yMax]).range([H - M.b, M.t]);
  const thresholdY = ys(50);

  // Split the path at long gaps (>3 months) so the line doesn't visually
  // interpolate across the structural 2015-2020 Wayback gap.
  const segments: { date: Date; value: number }[][] = [];
  let current: { date: Date; value: number }[] = [];
  for (let i = 0; i < data.length; i += 1) {
    const point = data[i]!;
    const prev = data[i - 1];
    if (prev) {
      const gap =
        (point.date.getFullYear() - prev.date.getFullYear()) * 12 +
        (point.date.getMonth() - prev.date.getMonth());
      if (gap > 3) {
        if (current.length) segments.push(current);
        current = [];
      }
    }
    current.push(point);
  }
  if (current.length) segments.push(current);

  const lineGen = line<{ date: Date; value: number }>()
    .x((d) => xs(d.date))
    .y((d) => ys(d.value))
    .curve(curveMonotoneX);

  const yearTicks = [1950, 1970, 1990, 2010];
  const sparseCutoff = new Date("2014-09-01");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="ISM PMI 1948 to present sparkline"
      className="h-[110px] w-full max-w-[420px]"
    >
      <line
        x1={M.l}
        x2={W - M.r}
        y1={thresholdY}
        y2={thresholdY}
        className="stroke-ink-300"
        strokeDasharray="2 3"
      />
      <text
        x={W - M.r}
        y={thresholdY - 3}
        textAnchor="end"
        className="fill-ink-300 font-sans text-[9px] uppercase tracking-[0.1em]"
      >
        50
      </text>
      {yearTicks.map((y) => {
        const tickX = xs(new Date(`${y}-01-01`));
        return (
          <text
            key={y}
            x={tickX}
            y={H - 3}
            textAnchor="middle"
            className="fill-ink-300 font-sans text-[9px]"
          >
            {y}
          </text>
        );
      })}
      {segments.map((seg, i) => (
        <path
          key={i}
          d={lineGen(seg) ?? ""}
          className="fill-none stroke-ink-700"
          strokeWidth={1}
        />
      ))}
      {data
        .filter((d) => d.date >= sparseCutoff)
        .map((d, i) => (
          <circle key={i} cx={xs(d.date)} cy={ys(d.value)} r={1.75} className="fill-oxblood" />
        ))}
    </svg>
  );
}
