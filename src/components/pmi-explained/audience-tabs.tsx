"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AudienceKey = "beginner" | "trader" | "purchasing" | "economist";

interface Audience {
  key: AudienceKey;
  label: string;
  blurb: string;
  body: React.ReactNode;
}

const AUDIENCES: readonly Audience[] = [
  {
    key: "beginner",
    label: "Beginner",
    blurb: "If you've never read a PMI release.",
    body: (
      <>
        <p>
          Forget the jargon. Around 300 purchasing managers in manufacturing — and a similar
          panel in services — fill out the same short survey each month. For each part of their
          operation (orders, production, hiring, prices, inventory), they answer one question: is
          it better, the same, or worse than last month? ISM rolls those answers into a single
          number where 50 = flat. Above 50, more people said &quot;better&quot; than &quot;worse.&quot;
          Below 50, the opposite.
        </p>
        <p>
          The reason reporters care: it&apos;s fast (out the first business day for the prior
          month, while GDP takes another six weeks), it&apos;s been running since 1948, and
          purchasers see the economy two steps upstream of the cash-register data the government
          eventually publishes.
        </p>
        <p>
          The single fact worth carrying: <strong className="text-ink-700">a PMI below 45 that
          stays there for a few months has preceded every US recession since 1948.</strong>{" "}
          Not every dip below 45 turns into a recession — PMI has dipped below 45 in 1995, 2012,
          2015-16, and 2022-23 without one. See <a href="/decompose" className="underline
          decoration-paper-edge underline-offset-2 hover:decoration-oxblood">/decompose</a>{" "}
          for false-positive counts. But every recession showed up in the PMI first.
        </p>
        <p>
          What to ignore: month-to-month moves smaller than two points, single-industry callouts
          in news headlines (one industry doesn&apos;t make an economy), and the breathless
          coverage that happens whenever the headline crosses 50. The 50-line is a milestone, not
          a magic number — a country whose PMI moves from 49.5 to 50.5 hasn&apos;t suddenly
          switched economic regimes.
        </p>
      </>
    ),
  },
  {
    key: "trader",
    label: "Trader",
    blurb: "Rates, FX, equities, commodities.",
    body: (
      <>
        <p>
          Every desk has a PMI playbook. The headline drops at 10:00 AM ET on the first business
          day; Services follows on the third. What moves markets is the deviation from Bloomberg
          consensus, scaled by the historical standard deviation. A one-sigma upside surprise
          (~1.5 PMI points above consensus) is a tradable event in the front-end of the curve.
        </p>
        <p>
          Reaction function, all else equal: a strong Manufacturing print bear-flattens the curve
          via the 2y, strong-USD via rate differentials, and rotates equities into industrials,
          materials, energy, small-caps. A weak print bull-steepens the curve, favors staples,
          utilities, mega-cap quality. Services PMI maps more cleanly to consumer-discretionary
          and financials. Copper and oil correlate with <em>global</em>{" "}
          PMI breadth (the JPMorgan / S&amp;P Global global manufacturing PMI), not US-only.
        </p>
        <p>
          Subindices to watch beyond the headline: <strong className="text-ink-700">Prices</strong>{" "}
          is the cleanest leading indicator of PPI and CPI direction; rate desks trade the
          headline through it. <strong className="text-ink-700">Supplier Deliveries</strong>{" "}
          is the trap — pre-2020, rising SD meant strong demand; 2020-2022 it inverted because
          supply chains were physically broken. Pair SD with Prices to disambiguate.{" "}
          <strong className="text-ink-700">New Orders minus Inventories</strong>{" "}
          leads the headline by 3-6 months.
        </p>
        <p>
          Common mistakes: trading the headline before reading breadth (a 51 with breadth 3/10 is
          worse than a 49 with breadth 7/10); ignoring the prior-month revision; treating
          Manufacturing PMI as proxy for an economy where manufacturing is ~10% of GDP.
        </p>
      </>
    ),
  },
  {
    key: "purchasing",
    label: "Purchasing",
    blurb: "Supply chain & procurement.",
    body: (
      <>
        <p>
          This is, originally, your survey. ISM was founded in 1915 as the National Association of
          Purchasing Agents (NAPM until 2002), and the Report on Business was built by purchasing
          managers, for purchasing managers, decades before traders or economists started reading
          it. The headline is downstream of operational decisions you make every day; the
          subindices are the operational dashboard.
        </p>
        <p>
          What to read first: <strong className="text-ink-700">Supplier Deliveries</strong>{" "}
          is the most direct lead-time signal in public macro data — rising = slowing = capacity-
          constrained. <strong className="text-ink-700">Prices</strong>{" "}
          leads PPI by 1-3 months; if it flips above 70, expect supplier price-increase letters
          within a quarter.{" "}
          <strong className="text-ink-700">Customer Inventories</strong> (Manufacturing only) is
          bullish when low — CI &lt; 45 is the strongest predictor of a near-term re-order surge.{" "}
          <strong className="text-ink-700">Backlog of Orders</strong>{" "}
          tells you your suppliers&apos; capacity headroom; rising backlog plus rising Prices =
          vendors will push pricing up.
        </p>
        <p>
          Negotiation leverage shifts with the data. When SD spikes (long lead times) you lose
          leverage; when New Orders falls below 50 industry-wide, you gain it. Use the 18-industry
          breakdown to localize the read: if your category is in the bottom-five contracting
          industries, your suppliers&apos; competitive position is weak even when the macro
          headline looks strong.
        </p>
        <p>
          The Services NMI&apos;s <strong className="text-ink-700">Inventory Sentiment</strong>{" "}
          (asking whether respondents feel inventory is &quot;too high&quot;/&quot;too low&quot;/
          &quot;about right&quot;) is the only timely public read on B2B services pricing
          dynamics. Most procurement teams underuse it because of ISM&apos;s manufacturing-centric
          reputation.
        </p>
      </>
    ),
  },
  {
    key: "economist",
    label: "Economist",
    blurb: "Policy, nowcasting, corporate strategy.",
    body: (
      <>
        <p>
          PMI is not a direct input into the FOMC&apos;s reaction function the way CPI or
          unemployment are, but it is routinely cited in post-meeting press conferences and the
          Beige Book. Treat it as a top-tier <em>secondary</em>{" "}
          indicator — it shapes how the staff frames the data narrative even when it
          doesn&apos;t move a vote.
        </p>
        <p>
          For nowcasting, the Atlanta Fed&apos;s GDPNow ingests ISM directly; the canonical
          PMI-to-GDP regression comes from Koenig (2002), which underlies ISM&apos;s 42.5
          threshold (the value drifts between 42.3 and 42.7 as ISM re-fits). The rough rule that
          practitioners carry — every 1pt of PMI ≈ 0.3% of annualized real GDP, around trend — is
          regime-dependent and worth re-fitting every few years rather than memorizing.
        </p>
        <p>
          The recession-dating test most commonly cited (Banerjee &amp; Marcellino, building on
          Koenig) is the <strong className="text-ink-700">six-month moving average of
          Manufacturing PMI crossing below 50</strong> — that crossing has preceded every
          post-1948 US recession with a 2-10 month lead. False positives are real (1966, 1995,
          2012, 2015-16, 2022). Necessary but not sufficient.
        </p>
        <p>
          The manufacturing-services divergence is structural: manufacturing is ~10% of US GDP, so
          a GDP-tracking composite should weight Services ~70-75% / Manufacturing ~25-30%. But
          Manufacturing leads turning points by 3-6 months at peaks and 1-3 months at troughs.
          Limitations: diffusion math discards magnitude, each panel is ~300 firms (small
          relative to BLS&apos;s ~145,000-establishment CES), and the annual SA refresh shifts the
          entire history every January — backtests need re-running on the latest vintage.
        </p>
      </>
    ),
  },
];

export function AudienceTabs() {
  const [active, setActive] = React.useState<AudienceKey>("beginner");
  const current = AUDIENCES.find((a) => a.key === active) ?? AUDIENCES[0]!;

  return (
    <div className="mt-6">
      <div role="tablist" aria-label="Audience-specific reading guides" className="flex flex-wrap gap-1.5">
        {AUDIENCES.map((a) => {
          const isActive = a.key === active;
          return (
            <button
              key={a.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`audience-panel-${a.key}`}
              id={`audience-tab-${a.key}`}
              onClick={() => setActive(a.key)}
              className={cn(
                "border px-3.5 py-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.08em] transition-colors",
                isActive
                  ? "border-oxblood bg-oxblood text-paper"
                  : "border-paper-edge bg-paper text-ink-400 hover:border-ink-700 hover:text-ink-700",
              )}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-caption italic text-ink-400">{current.blurb}</p>

      <div
        role="tabpanel"
        id={`audience-panel-${current.key}`}
        aria-labelledby={`audience-tab-${current.key}`}
        className="editorial-prose mt-4"
      >
        {current.body}
      </div>

      <p className="mt-6 text-caption text-ink-400">
        These four guides are condensed from <code>docs/pmi-explainer.md</code> §4a–§4d in the
        repo, where each includes worked examples and references.
      </p>
    </div>
  );
}
