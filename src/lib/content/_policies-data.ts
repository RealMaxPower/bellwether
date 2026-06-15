import type { PolicyFrontmatter } from "./policy-schema";

/**
 * Seed policy events. Treat this as the editorial track's working file —
 * additions here appear on the timeline immediately. Phase 5 grows this to 40+.
 *
 * Each entry must satisfy policyFrontmatterSchema. Run `npm run typecheck` to
 * surface schema mismatches at build time.
 */
export const policiesData: readonly PolicyFrontmatter[] = [
  {
    id: "bretton-woods-collapse",
    verifiedAt: "2026-05-04",
    title: "Nixon Shock — Bretton Woods Collapses",
    startDate: "1971-08-01",
    regime: "Bretton Woods",
    kind: "monetary",
    isExogenous: false,
    summary:
      "On August 15, 1971, Nixon suspended the dollar's convertibility into gold and imposed a 10% import surcharge — ending the Bretton Woods system and ushering in the era of floating exchange rates. US manufacturers faced a sudden currency-policy regime change with knock-on effects for trade and inflation expectations.",
    interpretations: [
      {
        school: "monetarist",
        economist: "Milton Friedman",
        summary:
          "The collapse vindicated long-running monetarist arguments that fixed exchange rates were incompatible with independent monetary policy. Floating rates, despite short-run noise, would let policymakers target money supply rather than gold parity.",
      },
      {
        school: "post-keynesian",
        economist: "Hyman Minsky",
        summary:
          "Floating rates removed an external discipline on policy and amplified the financial-cycle dynamics already building in the late-1960s. The seeds of the 1970s stagflation were planted not by monetary expansion alone, but by the loss of a credible anchor.",
      },
      {
        school: "structural",
        economist: "Charles Kindleberger",
        summary:
          "The episode is best read as a hegemonic transition — the US chose domestic policy autonomy over its post-war commitment to provide a stable reserve. Manufacturing's losers and winners were determined more by trade-weighted exposure than by monetary mechanics.",
      },
    ],
    sources: [
      {
        label: "Nixon's August 15, 1971 address (transcript)",
        url: "https://www.presidency.ucsb.edu/documents/address-the-nation-outlining-new-economic-policy-the-challenge-peace",
        kind: "primary",
      },
      {
        label: "Federal Reserve History — Nixon Ends Bretton Woods",
        url: "https://www.federalreservehistory.org/essays/gold-convertibility-ends",
        kind: "secondary",
      },
      {
        label: "Garber, P. (1993) The Collapse of the Bretton Woods Fixed Exchange Rate System",
        url: "https://www.nber.org/system/files/chapters/c6876/c6876.pdf",
        kind: "primary",
      },
    ],
    ismComments: [
      {
        date: "1971-09-01",
        quote:
          "Buyers report a sudden change in the import-cost outlook following the surcharge announcement; domestic suppliers expect to recapture share but are uncertain about pricing.",
      },
    ],
  },
  {
    id: "1973-oil-shock",
    verifiedAt: "2026-05-04",
    title: "OPEC Embargo & 1973 Oil Shock",
    startDate: "1973-10-01",
    endDate: "1974-03-01",
    regime: "Stagflation",
    kind: "exogenous",
    isExogenous: true,
    summary:
      "OPEC's October 1973 embargo on Western nations supporting Israel quadrupled crude prices in months. US manufacturers — already dealing with wage-price controls — faced an energy-input shock that fed straight through to PMI and the headline inflation rate.",
    interpretations: [
      {
        school: "supply-side",
        economist: "Robert Mundell",
        summary:
          "The shock exposed how price controls and high marginal tax rates left US producers unable to absorb input-cost shocks. Supply-side rigidity — not monetary error — drove the persistence of the inflation that followed.",
      },
      {
        school: "keynesian",
        economist: "Arthur Okun",
        summary:
          "The misery index spiked because cost-push inflation interacted with already-anchored wage expectations. Demand management was largely impotent; the right policy was income-protection plus targeted relief, not aggregate-demand cooling.",
      },
      {
        school: "monetarist",
        economist: "Milton Friedman",
        summary:
          "The embargo was a relative-price shock; the persistent inflation that followed reflected continued monetary accommodation. Tighter money in 1973 would have shortened the inflation episode at the cost of a sharper recession.",
      },
    ],
    sources: [
      { label: "FRB San Francisco — The 1973 Oil Crisis", url: "https://www.frbsf.org/economic-research/publications/economic-letter/1979/january/the-1973-oil-crisis/", kind: "secondary" },
      { label: "EIA Monthly Energy Review — historical crude prices", url: "https://www.eia.gov/totalenergy/data/monthly/", kind: "primary" },
      { label: "Hamilton, J.D. (1983) Oil and the Macroeconomy Since World War II", url: "https://www.jstor.org/stable/1832055", kind: "primary" },
    ],
    ismComments: [
      {
        date: "1973-12-01",
        industry: "Petroleum",
        quote:
          "Allocation orders are unprecedented; production scheduling has been compressed to two-week horizons.",
      },
    ],
  },
  {
    id: "volcker-disinflation",
    verifiedAt: "2026-05-04",
    title: "Volcker Disinflation",
    startDate: "1979-08-01",
    endDate: "1982-08-01",
    regime: "Stagflation",
    kind: "monetary",
    isExogenous: false,
    summary:
      "Paul Volcker, sworn in as Fed Chair in August 1979, shifted FOMC operating procedure to target nonborrowed reserves — accepting whatever interest rates resulted. The Fed Funds rate spiked above 19%; the PMI plunged into the 30s; manufacturing employment fell sharply. By 1983, headline inflation had collapsed from 14% to under 4%, but the cost was the deepest postwar recession to that date.",
    interpretations: [
      {
        school: "monetarist",
        economist: "Milton Friedman",
        summary:
          "The disinflation worked precisely because the Fed targeted aggregates, not rates. The pain was unavoidable given the inflation expectations that had built up — credibility had to be re-established the hard way.",
      },
      {
        school: "post-keynesian",
        economist: "Sidney Weintraub",
        summary:
          "The recession was a policy choice and the costs fell disproportionately on durable-goods workers and the rust belt. Income-policy alternatives — wage-price coordination — were dismissed too quickly and the social cost of the chosen path was higher than necessary.",
      },
      {
        school: "neoclassical",
        economist: "Thomas Sargent",
        summary:
          "Once the regime change was credibly signaled, expectations adjusted and the disinflation proceeded faster than backward-looking Phillips-curve models predicted. The Volcker episode was one of the cleanest tests of the rational-expectations critique.",
      },
    ],
    sources: [
      { label: "Volcker, P. (2018) Keeping At It (memoir)", url: "https://www.publicaffairsbooks.com/titles/paul-volcker/keeping-at-it/9781541788206/", kind: "primary" },
      { label: "FRB Cleveland — The Volcker Disinflation", url: "https://www.clevelandfed.org/publications/economic-commentary/2005/ec-20050801-the-volcker-disinflation", kind: "secondary" },
      { label: "Goodfriend & King (2005) The Incredible Volcker Disinflation", url: "https://www.nber.org/papers/w11562", kind: "primary" },
    ],
    ismComments: [
      {
        date: "1981-09-01",
        quote:
          "Order books are at their lowest level since 1975. Capital-equipment producers report cancellations exceeding new bookings for the third consecutive month.",
      },
      {
        date: "1982-11-01",
        quote:
          "The first signs of stabilization in new orders are appearing in non-durable categories. Durable-goods producers remain cautious.",
      },
    ],
  },
  {
    id: "nafta-1994",
    verifiedAt: "2026-05-04",
    title: "NAFTA Takes Effect",
    startDate: "1994-01-01",
    regime: "Great Moderation",
    kind: "trade",
    isExogenous: false,
    summary:
      "The North American Free Trade Agreement, signed in 1992 and implemented January 1, 1994, eliminated most tariffs between the US, Canada, and Mexico over 15 years. US manufacturers reorganized supply chains; auto and textile sectors saw the largest reallocations. Decades of subsequent debate centered on whether net employment effects were small or substantial.",
    interpretations: [
      {
        school: "neoclassical",
        economist: "Gary Hufbauer",
        summary:
          "Trade gains were diffuse and large; concentrated job losses in textiles and auto assembly were real but represented < 0.5% of total US employment. The aggregate productivity gains compounded across two decades and benefited consumers most.",
      },
      {
        school: "structural",
        economist: "Robert Scott (EPI)",
        summary:
          "The agreement produced a persistent goods-trade deficit with Mexico and accelerated the offshoring of mid-skill manufacturing. Local labor-market shocks in the upper Midwest were severe, persistent, and under-compensated by adjustment programs.",
      },
      {
        school: "post-keynesian",
        economist: "James Galbraith",
        summary:
          "NAFTA's effect on US manufacturing wages was the leading edge of a broader policy regime — capital mobility plus weakened bargaining institutions — that suppressed manufacturing-sector wages for two decades.",
      },
    ],
    sources: [
      { label: "USTR — NAFTA Final Text", url: "https://ustr.gov/trade-agreements/free-trade-agreements/north-american-free-trade-agreement-nafta", kind: "primary" },
      { label: "Hufbauer & Schott (2005) NAFTA Revisited (PIIE)", url: "https://www.piie.com/bookstore/nafta-revisited-achievements-and-challenges", kind: "secondary" },
      { label: "Hakobyan & McLaren (2016) Looking for Local Labor-Market Effects of NAFTA", url: "https://www.nber.org/papers/w16535", kind: "primary" },
    ],
    ismComments: [],
  },
  {
    id: "covid-shock-2020",
    verifiedAt: "2026-05-04",
    title: "COVID-19 Shock & CARES Act",
    startDate: "2020-03-01",
    endDate: "2020-12-01",
    regime: "Pandemic & Reshoring",
    kind: "exogenous",
    isExogenous: true,
    summary:
      "March 2020's pandemic shutdowns produced the sharpest peacetime collapse in US manufacturing on record — PMI fell into the low-40s within weeks. The CARES Act (March 2020) provided $2.2T of fiscal support; the Fed cut rates to zero and launched expanded QE. The downturn was unusually short: by mid-2020 manufacturing was already rebounding, reopening supply-chain bottlenecks instead of demand weakness.",
    interpretations: [
      {
        school: "keynesian",
        economist: "Paul Krugman",
        summary:
          "Aggressive fiscal action plus zero rates avoided a 1930s-style collapse. The unusual rebound shape — V-shaped not U — vindicated the textbook prescription for an exogenous demand shock.",
      },
      {
        school: "monetarist",
        economist: "John Taylor",
        summary:
          "The combination of rapid monetary expansion and fiscal transfers planted the seeds of the 2021–22 inflation. The right call was emergency liquidity in 2020 followed by a faster pivot than what actually occurred.",
      },
      {
        school: "structural",
        economist: "Mariana Mazzucato",
        summary:
          "The shock revealed how thinly capitalized US public-health and supply-chain capacity had become. Industrial-policy responses — CHIPS, IRA — were the consequential through-line, not the cyclical fiscal package.",
      },
    ],
    sources: [
      { label: "CRS — CARES Act Section-by-Section", url: "https://crsreports.congress.gov/product/pdf/R/R46291", kind: "primary" },
      { label: "BEA — Q2 2020 GDP Release", url: "https://www.bea.gov/data/gdp/gross-domestic-product", kind: "primary" },
      { label: "Bartik et al. (2020) The Impact of COVID-19 on Small Business Outcomes", url: "https://www.nber.org/papers/w26989", kind: "secondary" },
    ],
    ismComments: [
      {
        date: "2020-04-01",
        quote:
          "Demand has fallen off a cliff; the question now is whether suppliers can stay solvent long enough to meet the bounce-back when it comes.",
        sourceUrl:
          "https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/manufacturing/",
      },
    ],
  },
  {
    id: "tcja-2017",
    verifiedAt: "2026-05-04",
    title: "Tax Cuts and Jobs Act (TCJA)",
    startDate: "2017-12-01",
    regime: "Crisis & Recovery",
    kind: "fiscal",
    isExogenous: false,
    summary:
      "The TCJA cut the corporate rate from 35% to 21%, allowed full expensing of equipment investment, and made several individual changes. Manufacturing capex rose noticeably in 2018; PMI hit 60+ that summer before fading as global trade tensions intensified.",
    interpretations: [
      {
        school: "supply-side",
        economist: "Larry Kudlow",
        summary:
          "The capex response — particularly the response of equipment-heavy manufacturing — confirmed that the prior corporate rate was a binding constraint on US-located investment.",
      },
      {
        school: "neoclassical",
        economist: "Owen Zidar",
        summary:
          "The investment effect was real but smaller and shorter-lived than headline numbers suggested once you control for the parallel global manufacturing cycle. The wage pass-through in particular was modest.",
      },
      {
        school: "post-keynesian",
        economist: "Lance Taylor",
        summary:
          "The bill's distributional impact dominated its growth impact. Buybacks rose proportionally with capex, and the Treasury's revenue path forced offsetting fiscal consolidation later in the cycle.",
      },
    ],
    sources: [
      { label: "PL 115-97 — Tax Cuts and Jobs Act", url: "https://www.congress.gov/bill/115th-congress/house-bill/1", kind: "primary" },
      { label: "JCT TCJA Estimates", url: "https://www.jct.gov/publications/2017/jcx-67-17/", kind: "primary" },
      { label: "Zidar (2019) Tax Cuts for Whom?", url: "https://www.aeaweb.org/articles?id=10.1257/aer.20171958", kind: "primary" },
    ],
    ismComments: [],
  },
  {
    id: "china-tariffs-2018",
    verifiedAt: "2026-05-04",
    title: "Section 301 Tariffs on China",
    startDate: "2018-07-01",
    endDate: "2019-12-01",
    regime: "Crisis & Recovery",
    kind: "trade",
    isExogenous: false,
    summary:
      "Beginning July 2018, the USTR imposed escalating tariffs on Chinese imports, ultimately covering ~$370B at rates between 7.5–25%. Manufacturing PMI rolled over from its 2018 high, and supply-chain reorganization toward Vietnam, Mexico, and India accelerated through 2019. Most of the tariff structure was retained by the subsequent administration.",
    interpretations: [
      {
        school: "structural",
        economist: "Brad Setser",
        summary:
          "The tariffs accelerated changes that were already underway and shifted bilateral deficits without much aggregate effect. Real strategic implications came later through the CHIPS and IRA industrial-policy frame.",
      },
      {
        school: "neoclassical",
        economist: "Mary Amiti / Stephen Redding / David Weinstein",
        summary:
          "The tariff incidence fell almost entirely on US importers and consumers, with limited evidence of price absorption by Chinese exporters. Welfare losses were measurable; the strategic argument has to do most of the policy work.",
      },
      {
        school: "supply-side",
        economist: "Robert Lighthizer",
        summary:
          "The objective was not aggregate-welfare maximization — it was the credible threat to the previous trade-policy equilibrium. The PMI dip in 2019 reflected exactly the realignment cost the policy was designed to impose.",
      },
    ],
    sources: [
      { label: "USTR — Section 301 Investigation Report", url: "https://ustr.gov/issue-areas/enforcement/section-301-investigations", kind: "primary" },
      { label: "Amiti, Redding & Weinstein (2019) The Impact of the 2018 Trade War on US Prices", url: "https://www.nber.org/papers/w25672", kind: "primary" },
      { label: "Bown (2021) The US-China Trade War (PIIE)", url: "https://www.piie.com/research/piie-charts/anatomy-flailing-trade-war-section-301-tariffs", kind: "secondary" },
    ],
    ismComments: [
      {
        date: "2019-08-01",
        industry: "Electrical Equipment, Appliances & Components",
        quote:
          "Tariff pass-through is now showing in supplier quotes for Q4. Customers are pre-buying ahead of the December rate increase.",
        sourceUrl:
          "https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/manufacturing/",
      },
    ],
  },
  {
    id: "post-covid-inflation",
    verifiedAt: "2026-05-04",
    title: "2021–2022 Inflation Cycle & Fed Liftoff",
    startDate: "2021-04-01",
    endDate: "2023-07-01",
    regime: "Pandemic & Reshoring",
    kind: "monetary",
    isExogenous: false,
    summary:
      "Headline CPI rose from 2% in early 2021 to a 9.1% peak in June 2022. The Fed held rates near zero until March 2022, then raised them at the fastest pace since the early 1980s — including four consecutive 75bp hikes. Manufacturing PMI rolled from the 60s into the high-40s; durable-goods orders softened materially.",
    interpretations: [
      {
        school: "monetarist",
        economist: "Lawrence Summers",
        summary:
          "The 2021 fiscal package was simply too large for the slack that remained, and the Fed's early reaction function was anchored to a transitory hypothesis that broke down once expectations began to drift. The eventual hiking cycle was correct but late.",
      },
      {
        school: "post-keynesian",
        economist: "Isabella Weber",
        summary:
          "The inflation episode was driven primarily by sectoral shocks — energy, autos, shipping — interacting with corporate pricing power, not by aggregate-demand overheating. Generalized rate hikes addressed the wrong margin.",
      },
      {
        school: "structural",
        economist: "Adam Tooze",
        summary:
          "The episode is best read as a polycrisis — pandemic supply disruption plus war-driven energy shock plus rapid fiscal expansion — and conventional Phillips-curve analysis missed all three drivers in different ways.",
      },
    ],
    sources: [
      { label: "FRB Press releases on rate decisions, 2022", url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm", kind: "primary" },
      { label: "BLS CPI historical series", url: "https://www.bls.gov/cpi/", kind: "primary" },
      { label: "Bernanke & Blanchard (2023) What Caused the US Pandemic-Era Inflation?", url: "https://www.brookings.edu/articles/what-caused-the-u-s-pandemic-era-inflation/", kind: "primary" },
    ],
    ismComments: [
      {
        date: "2022-09-01",
        quote:
          "Customer order patterns are normalizing; the post-pandemic surge has clearly broken. Inventory drawdowns dominate Q4 planning.",
        sourceUrl:
          "https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/manufacturing/",
      },
    ],
  },
  {
    id: "chips-act-2022",
    verifiedAt: "2026-05-04",
    title: "CHIPS and Science Act",
    startDate: "2022-08-01",
    regime: "Pandemic & Reshoring",
    kind: "fiscal",
    isExogenous: false,
    summary:
      "The CHIPS Act provided $52B in semiconductor manufacturing subsidies, $24B of investment tax credits, and major R&D funding. Combined with the Inflation Reduction Act's clean-energy provisions, it represented the largest US industrial-policy intervention since the 1950s. Announced fab capex jumped sharply but PMI's response was muted as global semi demand softened in 2023.",
    interpretations: [
      {
        school: "structural",
        economist: "Gary Pisano",
        summary:
          "The bill responded to a real strategic vulnerability identified during the 2020–21 chip shortage. The capacity build is multi-year; one or two years of soft PMI does not falsify the policy thesis.",
      },
      {
        school: "neoclassical",
        economist: "Christopher Snyder",
        summary:
          "The case-by-case eligibility process risks rent-seeking and may not pick the highest-marginal-product investments. A broader investment incentive — equipment expensing, R&D credit expansion — would have been more efficient.",
      },
      {
        school: "supply-side",
        economist: "Michael Strain",
        summary:
          "Industrial policy has a thin track record in the US since the 1980s. The bill's success will depend less on the subsidy size than on the regulatory and permitting environment fab construction faces.",
      },
    ],
    sources: [
      { label: "PL 117-167 — CHIPS and Science Act", url: "https://www.congress.gov/bill/117th-congress/house-bill/4346", kind: "primary" },
      { label: "BEA — Construction Spending: Manufacturing", url: "https://www.bea.gov/", kind: "primary" },
      { label: "CRS — CHIPS Act Section-by-Section", url: "https://crsreports.congress.gov/product/pdf/R/R47523", kind: "secondary" },
    ],
    ismComments: [],
  },
];
