import { z } from "zod";

export const rateActionSchema = z.enum([
  "cut-50",
  "cut-25",
  "hold",
  "hike-25",
  "hike-50",
  "hike-75",
]);
export type RateAction = z.infer<typeof rateActionSchema>;

export const rateActionLabels: Record<RateAction, string> = {
  "cut-50": "Cut 50 bps",
  "cut-25": "Cut 25 bps",
  hold: "Hold",
  "hike-25": "Hike 25 bps",
  "hike-50": "Hike 50 bps",
  "hike-75": "Hike 75 bps",
};

export const rateActionArrows: Record<RateAction, string> = {
  "cut-50": "↓↓",
  "cut-25": "↓",
  hold: "→",
  "hike-25": "↑",
  "hike-50": "↑↑",
  "hike-75": "↑↑↑",
};

export const fedChairInterpretationSchema = z.object({
  school: z.string(),
  economist: z.string(),
  summary: z.string(),
});
export type FedChairInterpretation = z.infer<typeof fedChairInterpretationSchema>;

export const scenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  decisionDate: z.string().regex(/^\d{4}-\d{2}-01$/),
  era: z.string(),
  protagonist: z.string(),
  hookQuestion: z.string(),
  /** Cutoff applied to all charts in this scenario. */
  dataCutoff: z.string().regex(/^\d{4}-\d{2}-01$/),
  dossier: z.array(z.string()).min(1).max(5),
  metrics: z.array(z.object({ label: z.string(), value: z.string(), hint: z.string().optional() })),
  /** Subset of choices visible for this scenario. */
  availableChoices: z.array(rateActionSchema).min(2),
  actualAction: rateActionSchema,
  outcomeSummary: z.string(),
  interpretations: z.array(fedChairInterpretationSchema).min(2),
});
export type Scenario = z.infer<typeof scenarioSchema>;

/**
 * Metrics show the latest figure published before the FOMC meeting, at the
 * values FRED carries today; PMI comes from the merged series the chart plots.
 * `dataCutoff` is the last month whose PMI was released before the meeting.
 */
export const scenarios: readonly Scenario[] = [
  {
    id: "volcker-1979",
    title: "Inflation is in double digits. What now?",
    decisionDate: "1979-08-01",
    era: "Volcker, August 1979",
    protagonist: "Paul Volcker",
    hookQuestion: "Inflation is in double digits. What now?",
    dataCutoff: "1979-07-01",
    dossier: [
      "You have just been sworn in as Chair of the Federal Reserve. The economy is in turmoil. The misery index — the sum of inflation and unemployment — is soaring. The dollar is under renewed pressure on foreign exchange markets.",
      "Recent reports show CPI accelerating, driven by oil shocks and deeply entrenched inflation expectations. The public has lost faith in the government's ability to maintain the purchasing power of the currency.",
      "President Carter has appointed you with a mandate to break the back of inflation, but the political pressure is immense. A severe tightening will almost certainly trigger a recession heading into his re-election year.",
    ],
    metrics: [
      { label: "CPI YoY", value: "10.9%" },
      { label: "Unemployment", value: "5.7%" },
      { label: "PMI", value: "51.3" },
      { label: "Fed Funds", value: "10.5%" },
      { label: "M2 growth", value: "8.0%" },
      { label: "GDP YoY", value: "2.7%" },
    ],
    availableChoices: ["hold", "hike-25", "hike-50", "hike-75"],
    actualAction: "hike-50",
    outcomeSummary:
      "Volcker shifted the FOMC to nonborrowed-reserve targeting in October 1979, accepting whatever rate level resulted. The Fed Funds rate spiked above 19% by 1981; PMI fell below 30 in mid-1980; the deepest postwar recession to that point followed. By 1983 inflation had collapsed under 4%.",
    interpretations: [
      {
        school: "Monetarist",
        economist: "Milton Friedman",
        summary:
          "Announcing reserve targets in October 1979 was the right break with rate-pegging, but the Fed never really carried it out — money growth swung more wildly afterwards than before. Inflation broke because the Fed finally held the line long enough, not because it practiced monetarism.",
      },
      {
        school: "Keynesian",
        economist: "Sidney Weintraub",
        summary:
          "Income-policy alternatives were dismissed too quickly. The recession's cost fell disproportionately on durable-goods workers and the rust belt; a wage-price coordination path could have achieved similar disinflation with less concentrated pain.",
      },
      {
        school: "Neoclassical",
        economist: "Thomas Sargent",
        summary:
          "A credible regime change can end inflation quickly and cheaply — but this one was only half a regime change. With deficits widening under Reagan, fiscal policy pointed the other way, which is why the 1981–82 disinflation cost so much output.",
      },
    ],
  },
  {
    id: "greenspan-1998",
    title: "LTCM nearly failed. The economy didn't.",
    decisionDate: "1998-09-01",
    era: "Greenspan, Fall 1998",
    protagonist: "Alan Greenspan",
    hookQuestion: "Long-Term Capital Management nearly failed. Cut rates with US growth at 4%?",
    dataCutoff: "1998-08-01",
    dossier: [
      "The US economy is humming — output is up about 4% on a year earlier, unemployment is at a 28-year low, and equity markets are richly valued. Inflation is benign.",
      "But Long-Term Capital Management — a hedge fund whose Nobel-laureate-staffed bets on convergence trades soured after Russia's August default — came within days of failing. Its $125 billion balance sheet and more than $1 trillion in notional derivatives threatened to cascade through the dealer banks.",
      "On September 23 the New York Fed brokered a $3.6 billion private recapitalization, but markets are still gripped by deleveraging. The question on your desk: should the Fed cut despite a strong economy, to restore liquidity?",
    ],
    metrics: [
      { label: "CPI YoY", value: "1.6%" },
      { label: "Unemployment", value: "4.5%" },
      { label: "PMI", value: "49.3" },
      { label: "Fed Funds", value: "5.50%" },
      { label: "S&P 500 (Aug)", value: "-14.6%" },
      { label: "GDP YoY", value: "4.1%" },
    ],
    availableChoices: ["cut-50", "cut-25", "hold"],
    actualAction: "cut-25",
    outcomeSummary:
      "The Fed cut 25bps in September 1998, then again in October and November — a 75bp easing cycle to restore liquidity. Markets rallied; the dot-com expansion accelerated; critics later argued the cuts contributed to the late-1990s asset bubble.",
    interpretations: [
      {
        school: "Keynesian",
        economist: "Paul Krugman",
        summary:
          "A textbook 'flight to safety' moment. Liquidity provision was correct; concerns about moral hazard were overblown given the systemic stakes.",
      },
      {
        school: "Austrian",
        economist: "William White (BIS)",
        summary:
          "The cuts validated the put-on-the-Fed mental model that would become disastrous a decade later. The right call was tighter policy plus targeted liquidity — not a generalized rate cut into a strong economy.",
      },
      {
        school: "Monetarist",
        economist: "Anna Schwartz",
        summary:
          "The Fed's dual mandate gave it cover, but the action was disciplinary supervision masquerading as monetary policy. The asset-price feedback loop was already underway.",
      },
    ],
  },
  {
    id: "bernanke-2008",
    title: "Lehman has filed. AIG is next.",
    decisionDate: "2008-09-01",
    era: "Bernanke, September 2008",
    protagonist: "Ben Bernanke",
    hookQuestion:
      "Lehman has filed. AIG is hours from failure. Treasury is days from asking Congress for $700 billion.",
    dataCutoff: "2008-08-01",
    dossier: [
      "Lehman Brothers filed for Chapter 11 on September 15, 2008. A run is building on money-market funds that hold Lehman paper. Commercial paper markets are seizing. AIG faces a $20 billion margin call it cannot meet.",
      "The Treasury is preparing what will become the TARP — a $700B authorization. The Fed has limited 13(3) authority but you have already extended it further than any predecessor.",
      "The August PMI printed 49.2. Home prices are down about 16% from a year earlier. Your decision: how aggressively does the Fed cut, and which extraordinary facilities does it open?",
    ],
    metrics: [
      { label: "CPI YoY", value: "5.4%" },
      { label: "Unemployment", value: "6.1%" },
      { label: "PMI", value: "49.2" },
      { label: "Fed Funds", value: "2.00%" },
      { label: "VIX", value: "32" },
      { label: "GDP YoY", value: "1.4%" },
    ],
    availableChoices: ["cut-50", "cut-25", "hold"],
    actualAction: "hold",
    outcomeSummary:
      "The FOMC held at 2% on September 16 — the same day the Fed lent AIG $85 billion under its emergency 13(3) authority. On October 8 it cut 50bps in an unscheduled move coordinated with five other central banks, then cut steadily to a 0–0.25% target by December. New facilities (AMLF, CPFF, and more) joined the TAF and PDCF opened earlier in the crisis, and the first round of QE came in November. The liquidity crisis stabilized; the demand collapse was severe.",
    interpretations: [
      {
        school: "Keynesian",
        economist: "Paul Krugman",
        summary:
          "Aggressive ease plus expansive lender-of-last-resort facilities prevented a 1930s-style collapse. The error was in not pushing for fiscal action commensurate with the shock.",
      },
      {
        school: "Rules-based",
        economist: "John Taylor",
        summary:
          "Rates held too low in 2003–05 fed the boom, and the crisis response misdiagnosed the bust — treating counterparty risk as a liquidity shortage. The ad hoc, deal-by-deal interventions of 2008 added uncertainty that prolonged and worsened the crisis.",
      },
      {
        school: "Structural",
        economist: "Adam Tooze",
        summary:
          "The episode has to be read as a global dollar funding crisis, not just a US housing-mortgage event. The currency-swap lines to foreign central banks were as important as the rate decision.",
      },
    ],
  },
  {
    id: "powell-2018",
    title: "Tariffs are landing. Markets are sliding.",
    decisionDate: "2018-12-01",
    era: "Powell, December 2018",
    protagonist: "Jerome Powell",
    hookQuestion: "Tariffs are landing. Stocks are sliding. Hike anyway?",
    dataCutoff: "2018-11-01",
    dossier: [
      "It is December 2018. The Fed has hiked three times this year — March, June, and September. The dot plot still implies further hikes in 2019.",
      "But Section 301 tariffs on Chinese imports are biting; the ISM PMI has cooled from its summer peak and factory surveys abroad are softening; the S&P 500 is down 13% from its September record. The yield curve is flattening fast.",
      "Today is the December FOMC. The market is pricing a 70% chance of a hike but the political pressure against one is louder than at any time in your tenure.",
    ],
    metrics: [
      { label: "CPI YoY", value: "2.2%" },
      { label: "Unemployment", value: "3.8%" },
      { label: "PMI", value: "59.3" },
      { label: "Fed Funds", value: "2.25%" },
      { label: "S&P 500 (3mo)", value: "-12%" },
      { label: "GDP YoY", value: "3.1%" },
    ],
    availableChoices: ["cut-25", "hold", "hike-25"],
    actualAction: "hike-25",
    outcomeSummary:
      "Powell hiked 25bps and signaled more in 2019. Stocks fell another 6% by Christmas Eve before recovering to their December 19 level by year-end. By January 4, 2019, the Fed had pivoted publicly toward 'patience'; by July it had begun cutting. The episode reshaped Fed communication for years.",
    interpretations: [
      {
        school: "Neoclassical",
        economist: "John Cochrane",
        summary:
          "The hike was correct on the data; the communication was the error. Forward guidance had been overpromised, and the gap between dot-plot signals and reality cost more credibility than the move itself.",
      },
      {
        school: "Keynesian",
        economist: "Janet Yellen",
        summary:
          "By late 2018 the global picture warranted patience. The hike was technically defensible but contributed to a financial-conditions tightening that didn't serve the dual mandate well.",
      },
      {
        school: "Structural",
        economist: "Brad Setser",
        summary:
          "The Fed had no good way to model the trade-policy shock as a monetary problem. The right answer was probably to hold and explicitly cite supply-chain uncertainty, but that wasn't a script the Fed had practiced.",
      },
    ],
  },
  {
    id: "powell-2022",
    title: "Inflation is at 8.6%. How fast?",
    decisionDate: "2022-06-01",
    era: "Powell, June 2022",
    protagonist: "Jerome Powell",
    hookQuestion: "Inflation just printed 8.6%. The labor market is tight. Pace of hikes?",
    dataCutoff: "2022-05-01",
    dossier: [
      "Headline CPI just printed 8.6% — the highest reading since 1981. Energy and shelter are leading; core inflation has broadened. Wage growth is running near 6%.",
      "The Fed began hiking in March 2022, taking the target range from near zero to 0.75–1.00% in two meetings. The June meeting is here: market pricing implies a 75bp move, the largest single-meeting hike since 1994.",
      "But housing is already wobbling, and the post-COVID supply chain is starting to unkink. A 75bp move risks tipping the economy; a 50bp move risks losing the inflation-fighting credibility you have spent three months building.",
    ],
    metrics: [
      { label: "CPI YoY", value: "8.6%" },
      { label: "Unemployment", value: "3.6%" },
      { label: "Mfg PMI", value: "56.1" },
      {
        label: "Services PMI",
        value: "55.9",
        hint: "ISM Services release, 3 June 2022 (May data). Both sectors were still expanding; the goods/services divergence that defined this episode opened up over the rest of 2022, as manufacturing slid toward contraction while services held up.",
      },
      { label: "Fed Funds", value: "1.00%" },
      { label: "10-yr Yield", value: "3.40%" },
      { label: "GDP YoY", value: "4.0%" },
    ],
    availableChoices: ["hike-25", "hike-50", "hike-75"],
    actualAction: "hike-75",
    outcomeSummary:
      "Powell hiked 75bps in June 2022 and again in July, September, and November — four consecutive 75bp moves. CPI peaked at 9.1% that same month and fell steadily. In September 2024 the Fed began cutting; recession-watch indicators flashed but recession itself was avoided.",
    interpretations: [
      {
        school: "Keynesian",
        economist: "Lawrence Summers",
        summary:
          "The right call, but late. The 2021 fiscal package was too large for the slack remaining; an earlier liftoff would have prevented the worst of the run-up.",
      },
      {
        school: "Post-Keynesian",
        economist: "Isabella Weber",
        summary:
          "The inflation was driven primarily by sectoral shocks — energy, autos, shipping — interacting with corporate pricing power. Generalized rate hikes addressed the wrong margin and the soft-landing happened largely because supply-side issues resolved on their own.",
      },
      {
        school: "Structural",
        economist: "Adam Tooze",
        summary:
          "Best read as a polycrisis — pandemic supply disruption plus war-driven energy shock plus rapid fiscal expansion. Conventional Phillips-curve frameworks missed all three drivers in different ways.",
      },
    ],
  },
];

export function findScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
