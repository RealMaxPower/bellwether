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

export const scenarios: readonly Scenario[] = [
  {
    id: "volcker-1979",
    title: "Inflation is over 11%. What now?",
    decisionDate: "1979-08-01",
    era: "Volcker, August 1979",
    protagonist: "Paul Volcker",
    hookQuestion: "Inflation is over 11%. What now?",
    dataCutoff: "1979-07-01",
    dossier: [
      "You have just been sworn in as Chair of the Federal Reserve. The economy is in turmoil. The misery index — the sum of inflation and unemployment — is soaring. The dollar is plummeting on foreign exchange markets.",
      "Recent reports show CPI accelerating, driven by oil shocks and deeply entrenched inflation expectations. The public has lost faith in the government's ability to maintain the purchasing power of the currency.",
      "President Carter has appointed you with a mandate to break the back of inflation, but the political pressure is immense. A severe tightening will almost certainly trigger a recession heading into his re-election year.",
    ],
    metrics: [
      { label: "CPI YoY", value: "11.8%" },
      { label: "Unemployment", value: "6.0%" },
      { label: "PMI", value: "49.3" },
      { label: "Fed Funds", value: "11.0%" },
      { label: "M2 growth", value: "8.0%" },
      { label: "GDP YoY", value: "2.1%" },
    ],
    availableChoices: ["hold", "hike-25", "hike-50", "hike-75"],
    actualAction: "hike-50",
    outcomeSummary:
      "Volcker shifted the FOMC to nonborrowed-reserve targeting in October 1979, accepting whatever rate level resulted. The Fed Funds rate spiked above 19% by 1981; PMI fell into the 30s; the deepest postwar recession to that point followed. By 1983 inflation had collapsed under 4%.",
    interpretations: [
      {
        school: "Monetarist",
        economist: "Milton Friedman",
        summary:
          "Targeting reserves rather than rates was the decisive move — it converted the regime in a way the public could see. The recession was the unavoidable cost of restoring credibility.",
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
          "Once the regime change was credibly signaled, expectations adjusted faster than backward-looking Phillips-curve models predicted. Volcker's episode is one of the cleanest tests of the rational-expectations critique.",
      },
    ],
  },
  {
    id: "greenspan-1998",
    title: "LTCM is failing. The economy isn't.",
    decisionDate: "1998-09-01",
    era: "Greenspan, Fall 1998",
    protagonist: "Alan Greenspan",
    hookQuestion: "Long-Term Capital Management is failing. Cut rates with US growth at 4%?",
    dataCutoff: "1998-09-01",
    dossier: [
      "The US economy is humming — Q2 1998 GDP came in above 3%, unemployment is at a 28-year low, and equity markets are richly valued. Inflation is benign.",
      "But Long-Term Capital Management — a hedge fund whose Nobel-laureate-staffed bets on convergence trades have soured after Russia's August default — is hours from failure. Its $125 billion balance sheet and $1 trillion notional derivatives book threaten to cascade through the dealer banks.",
      "The New York Fed has organized a private rescue, but markets are still gripped by deleveraging. The question on your desk: should the Fed cut despite a strong economy, to restore liquidity?",
    ],
    metrics: [
      { label: "CPI YoY", value: "1.5%" },
      { label: "Unemployment", value: "4.5%" },
      { label: "PMI", value: "49.7" },
      { label: "Fed Funds", value: "5.50%" },
      { label: "S&P 500 (1mo)", value: "-9%" },
      { label: "GDP YoY", value: "4.4%" },
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
    hookQuestion: "Lehman has filed. AIG is hours from failure. The TARP is a week away.",
    dataCutoff: "2008-09-01",
    dossier: [
      "Lehman Brothers filed for Chapter 11 on September 15, 2008. Money-market funds 'broke the buck.' Commercial paper markets are seizing. AIG faces a $20 billion margin call it cannot meet.",
      "The Treasury is preparing what will become the TARP — a $700B authorization. The Fed has limited 13(3) authority but you have already extended it further than any predecessor.",
      "PMI just printed below 45. Housing prices are falling 18% YoY. Your decision: how aggressively does the Fed cut, and which extraordinary facilities does it open?",
    ],
    metrics: [
      { label: "CPI YoY", value: "5.4%" },
      { label: "Unemployment", value: "6.1%" },
      { label: "PMI", value: "44.8" },
      { label: "Fed Funds", value: "2.00%" },
      { label: "VIX", value: "32" },
      { label: "GDP YoY", value: "1.0%" },
    ],
    availableChoices: ["cut-50", "cut-25", "hold"],
    actualAction: "cut-50",
    outcomeSummary:
      "Bernanke cut 50bps in October 2008 (with most central banks coordinating), then steadily to a 0–0.25% target by December. The Fed launched alphabet-soup facilities (TAF, PDCF, AMLF, CPFF, etc.) and the first round of QE in November. The liquidity crisis stabilized; the demand collapse was severe.",
    interpretations: [
      {
        school: "Keynesian",
        economist: "Paul Krugman",
        summary:
          "Aggressive ease plus expansive lender-of-last-resort facilities prevented a 1930s-style collapse. The error was in not pushing for fiscal action commensurate with the shock.",
      },
      {
        school: "Monetarist",
        economist: "John Taylor",
        summary:
          "The Fed strayed from rule-based monetary policy and into discretionary credit allocation. The cleanup of the crisis worked, but the precedent of facility-by-facility intervention will haunt future policy debates.",
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
    title: "Tariffs are landing. Manufacturing is rolling.",
    decisionDate: "2018-12-01",
    era: "Powell, December 2018",
    protagonist: "Jerome Powell",
    hookQuestion: "Tariffs are landing. Manufacturing is rolling over. Hike anyway?",
    dataCutoff: "2018-12-01",
    dossier: [
      "It is December 2018. The Fed has hiked four times this year, including a September 25bp move. The dot plot still implies further hikes in 2019.",
      "But Section 301 tariffs on Chinese imports are biting; PMI new orders are softening; markets sold off 14% in October–November. The yield curve is flattening fast.",
      "Today is the December FOMC. The market is pricing a 70% chance of a hike but the political pressure against one is louder than at any time in your tenure.",
    ],
    metrics: [
      { label: "CPI YoY", value: "2.2%" },
      { label: "Unemployment", value: "3.7%" },
      { label: "PMI", value: "54.1" },
      { label: "Fed Funds", value: "2.25%" },
      { label: "S&P 500 (3mo)", value: "-14%" },
      { label: "GDP YoY", value: "2.5%" },
    ],
    availableChoices: ["cut-25", "hold", "hike-25"],
    actualAction: "hike-25",
    outcomeSummary:
      "Powell hiked 25bps and signaled more in 2019. Markets fell sharply through year-end. By January 4, 2019, the Fed had pivoted publicly toward 'patience'; by July it had begun cutting. The episode reshaped Fed communication for years.",
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
    title: "Inflation is at 9.1%. How fast?",
    decisionDate: "2022-06-01",
    era: "Powell, June 2022",
    protagonist: "Jerome Powell",
    hookQuestion: "Inflation just printed 9.1%. The labor market is tight. Pace of hikes?",
    dataCutoff: "2022-06-01",
    dossier: [
      "Headline CPI just printed 9.1% — the highest reading since 1981. Energy and shelter are leading; core inflation has broadened. Wage growth is running near 6%.",
      "The Fed began hiking in March 2022, going from zero to 1.5% in three meetings. The June meeting is here: market pricing implies a 75bp move, the largest single-meeting hike since 1994.",
      "But housing is already wobbling, and the post-COVID supply chain is starting to unkink. A 75bp move risks tipping the economy; a 50bp move risks losing the inflation-fighting credibility you have spent two months building.",
    ],
    metrics: [
      { label: "CPI YoY", value: "9.1%" },
      { label: "Unemployment", value: "3.6%" },
      { label: "Mfg PMI", value: "53.0" },
      {
        label: "Services PMI",
        value: "55.3",
        hint: "ISM Services release 1 July 2022 — services sector still expanding strongly while manufacturing decelerates. The goods/services divergence was a defining feature of this episode and shaped the FOMC's confidence in continuing aggressive hikes.",
      },
      { label: "Fed Funds", value: "1.50%" },
      { label: "10-yr Yield", value: "3.40%" },
      { label: "GDP YoY", value: "1.6%" },
    ],
    availableChoices: ["hike-25", "hike-50", "hike-75"],
    actualAction: "hike-75",
    outcomeSummary:
      "Powell hiked 75bps in June 2022 and again in July, September, and November — four consecutive 75bp moves. CPI peaked at 9.1% the same month and fell steadily. By mid-2024 the Fed had begun cutting; recession-watch indicators flashed but recession itself was avoided.",
    interpretations: [
      {
        school: "Monetarist",
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
