import Link from "next/link";
import { getMergedNMI, getMergedPMI } from "@/lib/data/series";
import { AudienceTabs } from "@/components/pmi-explained/audience-tabs";
import { GlossaryTerm } from "@/components/ui/glossary-term";

export const metadata = {
  title: "PMI Explained — Bellwether",
  description:
    "How to read the ISM Reports on Business — Manufacturing PMI and Services PMI: the 50-line, the subindices, the universal mechanics, and worked examples using the latest live prints.",
};

const monthLabel = (yyyyMmDd: string) => {
  const [y, m] = yyyyMmDd.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
};

export default function PMIExplainedPage() {
  const pmi = getMergedPMI();
  const nmi = getMergedNMI();
  const latest = pmi.observations.at(-1);
  const prior = pmi.observations.at(-2);
  const nmiLatest = nmi.observations.at(-1);
  const nmiPrior = nmi.observations.at(-2);
  if (!latest || !prior) {
    throw new Error("Merged PMI series has fewer than two observations.");
  }
  const delta = latest.value - prior.value;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const nmiDelta = nmiLatest && nmiPrior ? nmiLatest.value - nmiPrior.value : null;
  const nmiDirection =
    nmiDelta == null ? "flat" : nmiDelta > 0 ? "up" : nmiDelta < 0 ? "down" : "flat";
  const nmiIsSynthetic = nmi.provenance === "synthetic";

  return (
    <div className="container max-w-3xl py-10 md:py-14">
      <p className="mb-2 text-caption uppercase tracking-wider text-accent-dark">PMI explained</p>
      <h1 className="font-serif text-display-2 text-ink-700">
        How to read the Report on Business.
      </h1>

      <div className="editorial-prose mt-8">
        <p>
          The Institute for Supply Management (ISM) publishes a monthly diffusion-index survey of
          US business activity. It is the earliest, broadest read on whether the US economy
          expanded or contracted last month — and it predates every other major economic indicator
          in the release calendar by weeks.
        </p>
        <p>
          The single most important number in any release is whether the headline is above or
          below <strong>50</strong>. Above 50 means the surveyed sector grew vs. the prior month;
          below 50 means it shrank. The further from 50, the broader and stronger the move. The
          rest of this page is the framework that turns that one number into something useful.
        </p>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-ink-700/15 bg-paper-2/40 p-4">
          <p className="text-caption uppercase tracking-wider text-ink-400">
            Latest Manufacturing print
          </p>
          <p className="mt-1 font-serif text-title-1 text-ink-700">
            PMI {latest.value.toFixed(1)}{" "}
            <span className="font-sans text-body text-ink-500">
              · {monthLabel(latest.date)}
            </span>
          </p>
          <p className="mt-1 text-caption text-ink-500">
            {direction === "flat" ? (
              <>Unchanged from prior month.</>
            ) : (
              <>
                {direction === "up" ? "Up" : "Down"} {Math.abs(delta).toFixed(1)} pts from{" "}
                {monthLabel(prior.date)} ({prior.value.toFixed(1)}).
              </>
            )}{" "}
            Source: ISM Manufacturing Report on Business — see{" "}
            <Link href="/about-the-data" className="underline hover:text-ink-700">
              the data ledger
            </Link>{" "}
            for per-row provenance (Wayback archive + recent prints via ISM press releases).
          </p>
        </div>

        {nmiLatest && nmiPrior && (
          <div className="rounded-md border border-ink-700/15 bg-paper-2/40 p-4">
            <p className="text-caption uppercase tracking-wider text-ink-400">
              Latest Services print
            </p>
            <p className="mt-1 font-serif text-title-1 text-ink-700">
              NMI {nmiLatest.value.toFixed(1)}{" "}
              <span className="font-sans text-body text-ink-500">
                · {monthLabel(nmiLatest.date)}
              </span>
            </p>
            <p className="mt-1 text-caption text-ink-500">
              {nmiDelta == null || nmiDirection === "flat" ? (
                <>Unchanged from prior month.</>
              ) : (
                <>
                  {nmiDirection === "up" ? "Up" : "Down"} {Math.abs(nmiDelta).toFixed(1)} pts
                  from {monthLabel(nmiPrior.date)} ({nmiPrior.value.toFixed(1)}).
                </>
              )}{" "}
              {nmiIsSynthetic ? (
                <em className="not-italic text-accent-dark">
                  Synthetic placeholder — run <code>npm run import-wayback-nmi</code> for real
                  values.
                </em>
              ) : (
                <>Source: ISM Services Report on Business.</>
              )}
            </p>
          </div>
        )}
      </div>

      <h2 id="what-the-ism-publishes" className="mt-12 font-serif text-title-1 text-ink-700">
        What the ISM publishes
      </h2>
      <p className="mt-2 text-body text-ink-500">
        ISM&apos;s <GlossaryTerm slug="panel">panel</GlossaryTerm> members — purchasing and
        supply executives at hundreds of stratified-by-industry firms — answer one question per
        business measure each month: was activity{" "}
        <em>better</em>, <em>same</em>, or <em>worse</em> than last month? The{" "}
        <GlossaryTerm slug="diffusion-index">diffusion-index</GlossaryTerm> calculation is{" "}
        <code>1 × (% Better) + ½ × (% Same) + 0 × (% Worse)</code>, producing a number between 0
        and 100. Fifty means as many respondents reported improvement as decline. The math
        intentionally throws away magnitude — a small uptick at every firm scores the same as a
        large uptick at half the firms — which trades information density for noise resistance.
      </p>

      <h3 className="mt-6 font-serif text-title-2 text-ink-700">Manufacturing PMI</h3>
      <p className="mt-2 text-body text-ink-500">
        Running monthly since 1948, the longest unbroken monthly diffusion-index survey of US
        business activity. <GlossaryTerm slug="headline">Headline PMI</GlossaryTerm> is an
        equally weighted average of five{" "}
        <GlossaryTerm slug="subindex">subindices</GlossaryTerm>:{" "}
        <GlossaryTerm slug="new-orders">New Orders</GlossaryTerm>,{" "}
        <GlossaryTerm slug="production">Production</GlossaryTerm>,{" "}
        <GlossaryTerm slug="employment">Employment</GlossaryTerm>,{" "}
        <GlossaryTerm slug="supplier-deliveries">Supplier Deliveries</GlossaryTerm>,{" "}
        <GlossaryTerm slug="inventories">Inventories</GlossaryTerm>. The full ROB tracks five
        more — Prices, Backlog of Orders, New Export Orders, Imports, and Customers&apos;
        Inventories — that don&apos;t feed the headline but matter for breadth. Released on the
        first business day of each month at 10:00 AM ET, covering the prior month. The equal-
        weight scheme dates only to January 2008; pre-2008 weights were 30/25/20/15/10. Anyone
        backtesting on the spliced 1948-present series is mixing two methodologies unless they
        re-derive the headline from the underlying subindices.
      </p>

      <h3 className="mt-6 font-serif text-title-2 text-ink-700">Services PMI</h3>
      <p className="mt-2 text-body text-ink-500">
        Monthly since June 1997. The headline was originally the Business Activity Index; ISM
        introduced the composite <em>NMI</em> in January 2008 and renamed it{" "}
        <em>Services PMI</em> in August 2020, alongside the launch of the Hospital PMI. The
        composite is an equally weighted average of four subindices: Business Activity, New
        Orders, Employment, Supplier Deliveries. Released on the third business day of each
        month at 10:00 AM ET. The live Services callout above pulls from{" "}
        <code>data/nmi-wayback.json</code>; three of the four interactive modes (Timeline,
        Decompose, Heatmap) already render Services alongside Manufacturing. Fed Chair remains
        Manufacturing-only, since its scenarios all pre-date the Services PMI&apos;s 1997 launch.
      </p>

      <h3 className="mt-6 font-serif text-title-2 text-ink-700">The annual SA refresh</h3>
      <p className="mt-2 text-body text-ink-500">
        Each January, ISM re-estimates{" "}
        <GlossaryTerm slug="seasonal-adjustment">seasonal-adjustment</GlossaryTerm> factors for
        the entire history. A number that looked like 49.5 in November can be revised to 50.1
        the following February.
        The autumn-2008 cluster was the textbook example: the 2012 SA announcement noted those
        prints &quot;may not have been adequately handled with default settings&quot;, and ISM
        extended its revision window from the customary four years to seven to incorporate the
        corrections. Anyone modeling against pre-refresh vintages of GFC-era months will see a
        different recession bottom than someone using the current vintage.
      </p>

      <h2 id="how-to-read-a-release" className="mt-12 font-serif text-title-1 text-ink-700">
        How to read a release
      </h2>

      <h3 className="mt-6 font-serif text-title-2 text-ink-700">Three numbers, in order</h3>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-body text-ink-500 marker:text-ink-300">
        <li>
          <strong className="text-ink-700">The headline level</strong>{" "}
          — above or below 50, and by how much.
        </li>
        <li>
          <strong className="text-ink-700">The change vs. last month</strong>{" "}
          — the rate-of-change of a rate-of-change index, so this is the{" "}
          <em>acceleration</em>. A move from 51 to 53 is a different signal than 49 to 51.
        </li>
        <li>
          <strong className="text-ink-700">The{" "}
          <GlossaryTerm slug="breadth">breadth</GlossaryTerm></strong>{" "}
          — how many of the ten subindices are above 50. A headline above 50 with breadth below
          5/10 is a fragile expansion; the reverse is a resilient one.
        </li>
      </ol>

      <h3 className="mt-6 font-serif text-title-2 text-ink-700">The 50-line is not the only line</h3>
      <p className="mt-2 text-body text-ink-500">
        The 50-line tells you whether the <em>surveyed sector</em> expanded. The lesser-known
        thresholds — derived by ISM via regression against BEA GDP — tell you whether the{" "}
        <em>overall economy</em> is expanding: Manufacturing PMI above ~<strong>42.5</strong> →
        overall economy expanding; Services PMI above ~<strong>48.6</strong> → overall economy
        expanding. ISM re-fits the regression periodically and the Manufacturing anchor has been
        published as 42.3, 42.5, and 42.7 across the past decade (42.5 in the current ROB) —
        always check the live release for the active value rather than memorizing.
      </p>

      <h3 className="mt-6 font-serif text-title-2 text-ink-700">Surprise vs. consensus</h3>
      <p className="mt-2 text-body text-ink-500">
        Markets don&apos;t trade levels, they trade{" "}
        <GlossaryTerm slug="surprise">surprises</GlossaryTerm>. A Manufacturing PMI of 51.5 is
        bullish if consensus was 50.0 and bearish if consensus was 53.0. Every sell-side desk and
        every Bloomberg/Citi surprise index frames the print this way. If you only check the
        level, you will systematically read every release backwards relative to how the bond
        market reads it.
      </p>

      <h3 className="mt-6 font-serif text-title-2 text-ink-700">The respondent comments</h3>
      <p className="mt-2 text-body text-ink-500">
        Every report ends with quoted respondent comments. These are the only qualitative data in
        the release and are routinely under-weighted by quants. Comments lead the quantitative
        subindices when something structural is shifting — supply-chain dislocations in spring
        2020, semiconductor shortages in 2021, tariff repricing in 2025 all showed up in comments
        before they showed up in the diffusion math.
      </p>

      <h3 className="mt-6 font-serif text-title-2 text-ink-700">The most common misreads</h3>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-body text-ink-500 marker:text-ink-300">
        <li>
          <strong className="text-ink-700">Crossing vs. magnitude.</strong>{" "}
          A print of 50.2 vs. 49.8 is statistically indistinguishable. The press will report a
          regime flip; the data doesn&apos;t support one.
        </li>
        <li>
          <strong className="text-ink-700">Levels vs. changes.</strong>{" "}
          &quot;PMI is still above 50&quot; says nothing about whether the trend is up or down.
          Pair the level with the delta.
        </li>
        <li>
          <strong className="text-ink-700">Single-subindex stories.</strong>{" "}
          A Prices spike with no New Orders confirmation is a one-month commodity shock, not an
          inflation regime shift. The signal is in the cluster.
        </li>
        <li>
          <strong className="text-ink-700">Conflating ISM and S&amp;P Global.</strong>{" "}
          They are independent surveys of different panels using different question wording and
          frequently disagree, especially at turning points.
        </li>
      </ul>

      <h2 id="who-is-this-for" className="mt-12 font-serif text-title-1 text-ink-700">
        Reading guides by audience
      </h2>
      <p className="mt-2 text-body text-ink-500">
        The framework above is universal. What you do with it depends on whose decisions
        you&apos;re informing. Pick the lens that matches your work.
      </p>
      <AudienceTabs />

      <h2 id="worked-example" className="mt-12 font-serif text-title-1 text-ink-700">
        Worked example — the latest prints
      </h2>
      <p className="mt-2 text-body text-ink-500">
        The framework is most useful applied to <em>both</em> reports together. A divergence
        between Manufacturing and Services is itself information — Mfg has historically led at
        cyclical turning points, while Services dominates the GDP-tracking composite. Working
        through both anchors today:
      </p>
      <h3 className="mt-6 font-serif text-title-2 text-ink-700">Manufacturing</h3>
      <p className="mt-2 text-body text-ink-500">
        The most recent observation is{" "}
        <strong className="text-ink-700">{monthLabel(latest.date)}</strong> at{" "}
        <strong className="text-ink-700">PMI {latest.value.toFixed(1)}</strong>
        {direction === "flat" ? (
          <>, unchanged from {monthLabel(prior.date)}.</>
        ) : (
          <>
            ,{" "}
            {direction === "up" ? "up" : "down"} {Math.abs(delta).toFixed(1)} points from{" "}
            {monthLabel(prior.date)}&apos;s {prior.value.toFixed(1)}.
          </>
        )}{" "}
        Apply the framework: the headline is{" "}
        <strong className="text-ink-700">
          {latest.value >= 50 ? "above" : "below"} the 50-line
        </strong>{" "}
        ({latest.value >= 50 ? "manufacturing-sector expansion" : "manufacturing-sector contraction"}
        ), and{" "}
        <strong className="text-ink-700">
          {latest.value >= 42.5 ? "above" : "below"} the 42.5 anchor
        </strong>{" "}
        ({latest.value >= 42.5
          ? "consistent with overall-economy expansion"
          : "consistent with overall-economy contraction"}
        ). The rate-of-change reading — the acceleration — is{" "}
        {direction === "flat"
          ? "neutral"
          : direction === "up"
          ? "improving"
          : "deteriorating"}
        . For a full read you&apos;d add the breadth count from the five subindices on{" "}
        <Link href="/decompose" className="underline hover:text-ink-700">
          /decompose
        </Link>
        , the per-industry growth/contraction split on{" "}
        <Link href="/heatmap" className="underline hover:text-ink-700">
          /heatmap
        </Link>
        , and the policy regime context on the{" "}
        <Link href="/" className="underline hover:text-ink-700">
          timeline
        </Link>
        .
      </p>

      {nmiLatest && nmiPrior && (
        <>
          <h3 className="mt-6 font-serif text-title-2 text-ink-700">Services</h3>
          <p className="mt-2 text-body text-ink-500">
            The most recent observation is{" "}
            <strong className="text-ink-700">{monthLabel(nmiLatest.date)}</strong> at{" "}
            <strong className="text-ink-700">NMI {nmiLatest.value.toFixed(1)}</strong>
            {nmiDelta == null || nmiDirection === "flat" ? (
              <>, unchanged from {monthLabel(nmiPrior.date)}.</>
            ) : (
              <>
                ,{" "}
                {nmiDirection === "up" ? "up" : "down"} {Math.abs(nmiDelta).toFixed(1)} points
                from {monthLabel(nmiPrior.date)}&apos;s {nmiPrior.value.toFixed(1)}.
              </>
            )}{" "}
            Apply the framework: the headline is{" "}
            <strong className="text-ink-700">
              {nmiLatest.value >= 50 ? "above" : "below"} the 50-line
            </strong>{" "}
            ({nmiLatest.value >= 50 ? "services-sector expansion" : "services-sector contraction"}
            ), and{" "}
            <strong className="text-ink-700">
              {nmiLatest.value >= 48.6 ? "above" : "below"} the 48.6 anchor
            </strong>{" "}
            ({nmiLatest.value >= 48.6
              ? "consistent with overall-economy expansion"
              : "consistent with overall-economy contraction"}
            ). The rate-of-change reading is{" "}
            {nmiDelta == null || nmiDirection === "flat"
              ? "neutral"
              : nmiDirection === "up"
              ? "improving"
              : "deteriorating"}
            .
          </p>

          <h3 className="mt-6 font-serif text-title-2 text-ink-700">Read together</h3>
          <p className="mt-2 text-body text-ink-500">
            Services is roughly 70-75% of US GDP, so a value-added-weighted composite would be
            roughly{" "}
            <strong className="text-ink-700">
              {(nmiLatest.value * 0.75 + latest.value * 0.25).toFixed(1)}
            </strong>{" "}
            — Services-weighted ~75% / Manufacturing-weighted ~25%. That blended read{" "}
            {nmiLatest.value * 0.75 + latest.value * 0.25 >= 50 ? "stays above" : "is below"}{" "}
            the 50-line. The two reports{" "}
            {Math.abs(nmiLatest.value - latest.value) > 3
              ? `diverge by ${Math.abs(nmiLatest.value - latest.value).toFixed(1)} points this month — Manufacturing PMI ${latest.value > nmiLatest.value ? "running stronger" : "running weaker"} than Services PMI is itself information about which side of the economy is leading.`
              : "are within 3 points of each other this month — broadly aligned, no sector-divergence story to tell."}
          </p>
          <p className="mt-2 text-caption text-ink-400">
            ISM does not publish an official Manufacturing + Services composite; the 75/25 blend
            above is a back-of-envelope GDP-weighting, not an ISM number. The widely cited{" "}
            <em>US Composite PMI</em> is a separate product from S&amp;P Global Market Intelligence,
            built from S&amp;P&apos;s own PMI panels rather than ISM&apos;s.
          </p>
        </>
      )}

      <p className="mt-3 text-caption text-ink-400">
        Note: the Wayback series have structural gaps — Manufacturing 2015-04 → 2020-05, Services
        2015-04 → 2020-06 (the two series resume in different months because ISM&apos;s ROB URL
        structure stabilised at slightly different points). Recent <em>headline</em>{" "}
        prints come instead from ISM&apos;s monthly press releases on PRNewswire and are usually
        current within days of release; <em>subindex</em> breakdowns on /decompose and /heatmap
        still rely on Wayback and can run a few months behind. For the live ROB go to ismworld.org
        directly.
      </p>

      <div className="editorial-prose mt-12">
        <p>
          This page covers the universal mechanics every reader needs, plus the four audience
          lenses above (Beginner, Trader, Purchasing, Economist). The longer research brief that
          seeded those lenses lives at <code>docs/pmi-explainer.md</code> in the repo.
        </p>
        <p>
          For provenance on the numbers used here, see{" "}
          <Link href="/about-the-data" className="underline hover:text-ink-700">
            /about-the-data
          </Link>
          . For the editorial method behind the policy interpretations on the timeline, see{" "}
          <Link href="/about" className="underline hover:text-ink-700">
            /about
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
