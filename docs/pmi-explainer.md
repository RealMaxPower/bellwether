# How to read the ISM Reports on Business

A research brief on the ISM Manufacturing PMI and ISM Services (Non-Manufacturing) PMI for four audiences: the curious reader, the trader, the purchasing or supply-chain professional, and the economist or policy analyst.

> **Reading guide.** §1–§3 are universal. §4 is audience-specific — jump to whichever subsection matches your job. §5–§7 are reference material.
>
> **App status (May 2026):** The Services PMI is now wired in across most of the app — `/pmi-explained` shows live Manufacturing and Services prints side-by-side; `/about-the-data` documents both ledgers; and three of the four interactive modes (Timeline, Decompose, Heatmap) cover both reports. Only Fed Chair remains Manufacturing-only, because its scenarios all pre-date the Services PMI's 1997 launch.

---

## 1. Executive summary

The Institute for Supply Management (ISM) publishes two monthly diffusion-index surveys of US business activity. Together they are the earliest, broadest read on whether the US economy expanded or contracted last month. Both are released within the first three business days of the following month, and both predate every other major economic indicator in the release calendar.

- **ISM Manufacturing PMI** — running monthly since 1948, the longest unbroken monthly diffusion-index survey of US business activity (the Federal Reserve's Industrial Production index has been monthly since 1919, but it's a hard-data series, not a survey). Surveys ~400 manufacturing firms across 18 industries.
- **ISM Services PMI** (originally "Non-Manufacturing", renamed in August 2020) — monthly since 1997. Surveys a comparable panel of services firms, covering the ~80% of GDP that manufacturing leaves out.

The single most important number in either report is whether the headline is above or below **50**. Above 50 = the sector grew vs. the prior month; below 50 = it shrank. The further from 50, the broader and stronger the move. Two less-famous thresholds calibrate the level against the *whole* economy (not just the sector being surveyed): the Manufacturing PMI maps to overall GDP expansion above ~**42.3**, and the Services PMI maps to overall expansion above ~**48.6**. Both anchors are published by ISM itself, derived from regression against BEA GDP data.

For most readers the value of the reports is not the headline, it is the breadth: ten subindices per release, plus per-industry breakdowns, plus respondent comments in their own words. The headline is the answer; the subindices and comments are the explanation.

The rest of this document explains how each audience should turn that information into decisions.

---

## 2. What the ISM publishes

### Two surveys, same methodology

Both reports use the same underlying question template. ISM's panel members — purchasing and supply executives at hundreds of stratified-by-industry firms — are asked, for each of ten or so business measures, whether the activity was *Better*, *Same*, or *Worse* this month vs. last month. The diffusion-index calculation is:

```
index = (% Better) + ½ × (% Same)
```

This produces a number between 0 and 100. Fifty means as many respondents reported improvement as reported decline. The math intentionally throws away magnitude — a small uptick at every firm scores the same as a large uptick at half the firms — which trades information density for noise resistance. It also makes the index a pure rate-of-change signal: it tells you whether things got better or worse, not how far above or below trend they sit in absolute terms.

### Manufacturing report — what's in it

- **PMI (headline)** — equally weighted average of five subindices: New Orders, Production, Employment, Supplier Deliveries, Inventories. **Caveat:** the equal-weight scheme dates only to January 2008. Pre-2008 the weights were New Orders 30 / Production 25 / Employment 20 / Supplier Deliveries 15 / Inventories 10. Anyone backtesting on the spliced 1948-present headline series is mixing two methodologies unless they re-derive the headline from the underlying subindices under a single weighting scheme.
- **Other subindices reported but not in the headline:** Customer Inventories, Prices, Backlog of Orders, New Export Orders, Imports.
- **Industry breakdown:** 18 manufacturing industries, with rank-orderings of which grew and which shrank.
- **Respondent comments:** unattributed quotes from panel members, three to twenty per release.

Released **on the first business day** of each month at **10:00 AM ET**, covering the prior month.

### Services report — what's in it

- **Services PMI (headline, formerly NMI)** — equally weighted average of four subindices: Business Activity, New Orders, Employment, Supplier Deliveries.
- **Other subindices reported but not in the headline:** Inventories, Prices, Backlog of Orders, New Export Orders, Imports, Inventory Sentiment.
- **Industry breakdown:** 18 non-manufacturing industries.
- **Respondent comments:** same format as manufacturing.

Released **on the third business day** of each month at **10:00 AM ET**.

### The annual seasonal-adjustment refresh

Each January, ISM re-estimates the seasonal-adjustment factors for the entire history. This is the single largest source of mechanical movement in the series; a number that looked like 49.5 in November can be revised to 50.1 the following February. Anyone using PMI in an automated model needs to either (a) re-pull the full history each January, or (b) accept that their backtests will quietly drift.

The textbook example is the autumn 2008 cluster. The Department of Commerce's 2012 annual seasonal-adjustment announcement noted that "the unusually large declines in autumn 2008 associated with the recent recession may not have been adequately handled with default settings" of the SA procedure, and that as a result ISM extended its revision window from the customary four years to **seven years** to incorporate the corrections. In other words: the GFC-trough prints (October 2008 through early 2009) are exactly the part of the historical series that has shifted most across SA vintages. Anyone modeling against pre-refresh vintages of those months will see a different recession bottom than someone using the current vintage. The phenomenon is universal across SA series, but ISM PMI's reliance on the headline as a regime signal makes the consequences unusually visible — and a backtest that anchors to a specific historical headline value (e.g. "the Dec 2008 print of X") may be quoting a stale vintage.

### Where to get the data — and a redistribution caveat

A common pitfall worth flagging up front: **FRED no longer hosts ISM data.** On 24 June 2016, the St. Louis Fed removed all 22 ISM series (including the headline `NAPM` and the Services equivalent) at ISM's request, citing redistribution rights. Older articles, papers, and codebases that link `fred.stlouisfed.org/series/NAPM` will hit a 404; backtests built on FRED's mirror will silently end in mid-2016 unless re-pointed.

Practical options today:

- **ISM directly** (`ismworld.org`) — primary monthly PDFs and HTML summaries. The current month's print is free; the historical archive sits behind a redistribution policy that prohibits republishing the values, even if the values themselves are quotable.
- **FRED-MD** (McCracken & Ng, St. Louis Fed) — a freely redistributable monthly macro database, 1959 onward, with ~125 series including a PMI-equivalent. Used widely in academic nowcasting work.
- **OECD Business Tendency Surveys**, hosted on FRED as `BSCICP02USM460S` and similar codes for other countries. *Related but not identical* to ISM PMI — same idea (diffusion-index manufacturing confidence), different panel and weighting. Useful as a redistributable proxy and for cross-country comparisons.
- **S&P Global** publishes a parallel US PMI; it is **not** the same series — different panel, different question wording, frequently divergent (the two surveys ran several points apart for stretches of 2022–2023). Useful as a triangulation source, dangerous as a substitute.

For 1948–1958 (the pre-FRED-MD era) there is no clean redistributable digital source; values must be assembled from secondary references or the Wayback Machine archive of ISM's own historical tables.

---

## 3. How to read a release — the universal mechanics

### Three numbers, in order

When a release hits, read these three in sequence:

1. **The headline level** — above or below 50, and by how much.
2. **The change vs. last month** — the rate-of-change of a rate-of-change index, so this is the *acceleration*. A move from 51 to 53 is a different signal than 49 to 51.
3. **The breadth** — how many of the ten subindices are above 50. Any month where the headline is above 50 but breadth is below 5/10 is a fragile expansion; the reverse is a resilient one.

### The 50 line is not the only line

The famous 50-line tells you whether the *surveyed sector* expanded. The lesser-known thresholds — derived by ISM via regression against BEA GDP — tell you whether the *overall economy* is expanding:

- **Manufacturing PMI > 42.3** → overall economy is expanding
- **Services PMI > 48.6** → overall economy is expanding

A Manufacturing PMI of 47 sounds bad ("contracting!") but historically corresponds to weak-but-positive GDP growth. A Services PMI of 49 is much closer to the line.

**Note that these thresholds drift.** ISM re-fits the regression periodically and the Manufacturing anchor has been published as 42.3, 42.5, and 42.7 at various vintages over the past decade. Always check the current monthly ROB for the active value rather than memorizing the figures above.

### Surprise vs. consensus

Markets don't trade levels, they trade surprises. A Manufacturing PMI of 51.5 is bullish if consensus was 50.0 and bearish if consensus was 53.0. The Citi Economic Surprise Index, the Bloomberg ECO surprise screen, and any sell-side desk's quick reaction note all frame the print this way. If you only check the level, you will systematically read every release backwards relative to how the bond market reads it.

### The respondent comments

Every report ends with quoted respondent comments. These are the only qualitative data in the release and are routinely under-weighted by quants. Comments lead the quantitative subindices when something structural is shifting — supply-chain dislocations in spring 2020, semiconductor shortages in 2021, tariff repricing in 2025 all showed up in comments before they showed up in the diffusion math. Read them every month.

### The most common misreads

- **Crossing vs. magnitude.** The 50-line is dramatic but not always meaningful; a print of 50.2 vs. 49.8 is statistically indistinguishable.
- **Levels vs. changes.** "PMI is still above 50" is true but says nothing about whether the trend is up or down. Always pair the level with the delta.
- **Single-subindex stories.** A Prices spike with no New Orders confirmation is a one-month commodity shock, not an inflation regime shift.
- **Conflating ISM and S&P Global.** They are independent surveys of different panels using different question wording and frequently disagree, especially at turning points.

### Three case studies that calibrate the framework

The framework above is abstract; the value of PMI is in seeing how it has actually behaved in stress regimes. Three releases illustrate the three modes — panic crash, sudden-stop, and overheating peak — that the framework is designed to detect.

**October 2008 — the panic print (released 3 November 2008).** Manufacturing PMI 38.9, down 4.6 points from September's 43.5.[^vintage] New Orders crashed; the Prices subindex collapsed 16.5 points to 37 in a single month, the cleanest signal in modern PMI history that demand destruction had broken the inflation cycle. ISM took the unusual step of inserting a special survey on credit-market access; respondents reported 78.6% had cut spending or hiring. **What the framework caught:** the breadth count was deeply negative, Prices and New Orders moved together (a real demand event, not a single-subindex story), and the magnitude-of-the-move dwarfed any prior post-1982 release. The respondent-comments section was unusually concrete about Lehman-related credit availability — qualitative data that led the quantitative collapse by weeks.

[^vintage]: All values in the case studies are as-released (the figures real-time decision-makers actually saw). Current SA-revised vintages of these months differ slightly — September 2008's headline, for example, sits closer to 44.8 in current vintages versus the 43.5 originally released. The discrepancy is precisely the autumn-2008 SA-revision phenomenon discussed in §2.

**April 2020 — the sudden-stop print (released 1 May 2020).** Manufacturing PMI 41.5, down 7.6 points from March's 49.1. New Orders 27.1, Production 27.5, Employment 27.5 — three subindices simultaneously below 30, an extreme cluster. The trap in this release: Supplier Deliveries spiked to 76 (up 11 points), which under the pre-2020 playbook would have *boosted* the headline as a "strong demand" signal — instead, it was the SD inversion problem in real time, with deliveries slowing because the supply chain was breaking. Without that mechanical SD contribution, the headline would have printed in the low 30s. **What the framework caught:** the subindex cluster (NO/Production/Employment all in deep contraction) made it obvious that SD was misleading the headline upward; respondent comments led the print by weeks (March comments already described plant closures); and the breadth count was unanimous. **What the framework warned about:** never trust the headline alone in a regime change.

**June 2022 — the overheating peak (released 1 July 2022).** Manufacturing PMI 53.0, down 3.1 points from May's 56.1. Headline was still solidly in expansion. The Prices subindex registered 78.5 — well off the cycle peak of 92.1 from June 2021 (the highest reading since July 1979's 93.1) but still elevated, with the March–May 2022 sequence (87.1 / 84.6 / 82.2) showing how slowly Prices was rolling over. The cluster told the inflation-regime story before CPI did: a decelerating headline coexisting with input-cost pressure that hadn't yet released. **What the framework caught:** the divergence between a rolling-over headline and a still-hot Prices subindex was the textbook "sticky inflation" signal. Rate desks who were watching Prices were already pricing in aggressive Fed tightening before headline economic indicators caught up. This print also fell in an extended period (mid-2022 into 2023) where ISM and S&P Global's parallel US PMI ran several points apart — a useful reminder that "the US Manufacturing PMI" is not a single number when two reputable surveys disagree on the level.

These three together cover the three regimes PMI is best at identifying: a demand-driven crash where Prices confirms the move (2008), a supply-side rupture where SD inverts and the cluster matters more than the headline (2020), and an overheating peak where one subindex tells the inflation story while the headline still looks healthy (2022). Any audience reading PMI in 2026 should be able to map the current print onto one of these three regimes, or note that it doesn't fit and ask why.

---

## 4. Audience-specific reading guides

### 4a. For the general public — what does this number mean?

A purchasing manager at a big company is the person who decides, every month, how much steel to order, how many trucks to schedule, how many temps to hire. They have to commit real money based on what they think their company will sell next quarter. Roughly four hundred of them in manufacturing, and a similar number in services, fill out a short structured survey each month — for each part of their operation (orders, production, hiring, prices, inventory), they answer one question: is it better, the same, or worse than last month?

ISM rolls those answers up into a single number. Fifty means everything is flat. Above fifty means more of them said "better" than "worse." Below fifty means the opposite. That's it.

So why do reporters and economists pay so much attention to a survey of a few hundred people? Three reasons:

1. **It's fast.** The Manufacturing report comes out on the first business day of the month, covering the month that just ended. GDP, the official economic-growth number, doesn't come out for another month and a half — and even then, it gets revised twice. ISM is the closest thing to a real-time pulse on the economy.
2. **It's been running since 1948.** That's more than 75 years of unbroken monthly data. Almost no other indicator survives both the Eisenhower recessions and 2020.
3. **Purchasers see things first.** They place orders before the orders ship, ship before the items get sold, sell before the items get paid for. The PMI catches the economic action one or two steps upstream of what GDP eventually measures.

The single fact to remember: **a PMI below 45 that stays there for a few months has preceded every US recession since the survey began**. Not every dip below 45 turns into a recession, but every recession showed up in the PMI first.

What to ignore as a non-expert: month-to-month moves smaller than two points, single-industry callouts in news headlines (one industry doesn't make an economy), and the breathless coverage that happens whenever the headline crosses 50. The 50-line is a milestone, not a magic number — a country whose PMI moves from 49.5 to 50.5 hasn't suddenly switched economic regimes.

### 4b. For traders — the reaction function

PMI is one of the highest-information-density US releases of the month, and every desk has a playbook. Here's the working version.

**Release timing and positioning.** Manufacturing prints at 10:00 AM ET on the first business day. Services prints at 10:00 AM ET on the third business day. The two are read together; a surprise in one is partially confirmed or contradicted by the other. The two-day gap creates a setup where rates desks routinely fade the manufacturing reaction into the services release.

**Surprise math.** What moves markets is the deviation from the Bloomberg consensus, scaled by the historical standard deviation of the print. A one-sigma upside surprise — typically about 1.5 PMI points above consensus — is a small but tradable event in the front-end of the curve. A two-sigma surprise will move the 2y by 4–8bp on the first ten minutes after release.

**Asset-class reaction function** (directional, all else equal):

- **Rates.** A strong upside surprise in Manufacturing PMI bear-flattens the curve — the 2y sells off harder than the 10y because the surprise increases near-term Fed-hike probability more than it changes the terminal rate. A weak print bull-steepens via the front end as the market prices cuts. The Prices subindex specifically is what fixed-income traders watch most closely; it is among the earliest leading indicators of CPI direction and has high information weight in the Fed reaction function.
- **USD.** Procyclical to the print at most horizons — strong PMI = strong USD via rate differentials. The relationship inverts in flight-to-quality regimes (e.g., 2008, March 2020) where the dollar rallies on US weakness as a haven.
- **Equities (index level).** Modestly procyclical, but the bigger trade is sector rotation. Strong Manufacturing PMI favors industrials (XLI), materials (XLB), energy (XLE), small-caps (IWM), and value rotation. Weak Manufacturing PMI favors staples (XLP), utilities (XLU), and mega-cap quality. Services PMI is more correlated with consumer-discretionary (XLY) and financials (XLF) than Manufacturing PMI.
- **Commodities.** Copper and oil correlate with *global* PMI breadth (the JPMorgan/S&P Global global manufacturing PMI), more than with US-only ISM. A US-only beat that doesn't show up in China or Eurozone PMIs is a weak commodity signal. A coordinated global beat is a strong one.

**Subindices traders watch beyond the headline:**

- **Prices** — the cleanest leading indicator of PPI and, with a lag, CPI. Rate desks will trade the headline through Prices.
- **New Orders minus Inventories spread** — a classic 3–6 month lead on the Manufacturing PMI itself. New Orders > Inventories means demand is outpacing stock; restocking is coming.
- **Backlog of Orders** — a slower-moving indicator of capacity tightness; rate desks watch it for second-derivative signals on labor demand.

**The Supplier Deliveries inversion problem deserves its own paragraph** because it changed how every macro desk reads PMI after 2020. Pre-2020, the rule was clean: rising SD = slowing deliveries = lead times stretching = strong demand. Traders treated SD as a coincident demand strength signal and a near-term inflation precursor. The pandemic broke this. From 2020 through 2022, rising SD often meant the *opposite* — deliveries weren't slowing because demand was strong, they were slowing because the supply chain was physically broken (port congestion, semiconductor shortages, labor shortages, China lockdowns). A trader who treated 2020-2022 SD prints with the pre-2020 playbook would have read every supply-side disaster as a demand boom. By 2023 the signal was partially restored as supply chains normalized, but it remains *contaminated*: SD is now a conditional indicator whose interpretation depends on whether the prevailing constraint is demand or capacity. Read it alongside the Prices subindex (Prices high + SD high = supply-side; Prices low + SD high = demand-side) and the respondent comments to disambiguate. This is one of the most important post-COVID regime changes in macro indicator interpretation, and it's why 2026 PMI commentary still routinely warns readers not to read SD the way 2019 commentary did.

**Cross-checks.** Caixin China Manufacturing (released the night before ISM Manufacturing) and the Eurozone HCOB PMI (released same morning, earlier) frame the US print in global context. A US beat that goes against a China and Eurozone miss is suspect; a US beat that confirms global momentum is real.

**Common trader mistakes:**

- Trading the headline before reading breadth. A 51 with breadth 3/10 is a worse print than a 49 with breadth 7/10.
- Ignoring the prior-month revision in the headline number. ISM revises the prior month's headline almost every release, and surprise-vs-consensus is meaningless if your model is anchored to a stale prior.
- Treating Manufacturing PMI as a proxy for the whole economy. Manufacturing is ~10% of US GDP. The Services print, two days later, is the bigger move on the index level. Most retail commentary still leads with Manufacturing because it's older and more famous, not because it's more representative.

### 4c. For supply-chain and purchasing professionals

This is, originally, your survey. ISM was founded in 1915 as the National Association of Purchasing Agents (later NAPM, then ISM in 2002), and the Report on Business was built by purchasing managers, for purchasing managers, decades before traders or economists started reading it. The headline number is downstream of operational decisions you make every day. The subindices are the operational dashboard.

**Subindices that matter operationally:**

- **Supplier Deliveries** — the most direct lead-time signal in the public macro data. Rising SD = deliveries slowing = your suppliers are capacity-constrained or short on labor. Use this as an early-warning proxy when you can't get internal lead-time data fast enough. Note the post-2020 caveat: SD now responds to both demand surges and supply-side breakage, so pair it with industry-level breakdowns to disambiguate.
- **Prices** — input cost pressure across the panel. Leads PPI by 1–3 months. If Prices flips above 70, expect supplier price-increase letters within a quarter.
- **Backlog of Orders** — your suppliers' workload depth. Rising backlog plus rising Prices = vendors have capacity headroom and are using it to push pricing up. Negotiate hard before this combination peaks.
- **Customer Inventories** (Manufacturing only — there's no equivalent in Services) — the only subindex that's bullish *below* 50, the mirror of Supplier Deliveries which is bullish *above* 50. CI < 50 means downstream inventories are short, which historically predicts a re-order surge in the next two to three months. A standing CI < 45 is the strongest predictor of a near-term order spike.
- **Inventories** — your peers' stocking discipline. Rising Inventories with falling New Orders is the classic recession signature; it means production has gotten ahead of demand and somebody's about to slash orders.
- **Inventory Sentiment** (Services only) — asks whether respondents feel current inventory levels are "too high" / "too low" / "about right." Underused. A persistent "too high" reading is a leading indicator of services-sector discounting and pricing pressure.

**A simple operational dashboard.** Most purchasing leaders can build a useful four-quadrant view from the ISM data alone:

```
                  New Orders
                       ↑
        Strong demand  │  Strong demand
        Long lead time │  Short lead time
        (renegotiate   │  (push for volume
         contracts)    │   commitments)
   ────────────────────┼────────────────────  → Supplier Deliveries
        Weak demand    │  Weak demand
        Long lead time │  Short lead time
        (defer non-    │  (pricing
         critical buys)│   leverage to you)
                       ↓
```

Use the 18-industry breakdown to localize the read. ISM lists which industries are growing and contracting in rank order; if your category is in the bottom-five "contracting" industries, your suppliers' competitive position is weak and your pricing leverage is high — even if the macro headline is strong. Bellwether's heatmap visualizes exactly this dimension across 18 manufacturing industries × policy regimes.

**The Services report's hidden value for B2B services pricing.** If you're buying logistics, IT services, professional services, or financial services, the Services PMI subindices — particularly Inventory Sentiment, Prices, and Backlog of Orders — are the only timely public read on those vendor markets. Most procurement teams underuse this report because the manufacturing-centric reputation of ISM lingers.

### 4d. For economists, policy analysts, and corporate strategy

**The Fed.** PMI is not a direct input into the FOMC's reaction function in the way CPI or unemployment are, but it is routinely cited in post-meeting press conferences and the Beige Book. The Cleveland Fed and Chicago Fed have published research notes establishing the PMI's predictive value. The standard summary: ISM is a top-tier secondary indicator — it shapes how the staff frames the data narrative even when it doesn't move a vote.

**Nowcasting.** The Atlanta Fed's GDPNow ingests ISM headlines and subindices; it is the cleanest currently-published nowcast that uses ISM as an input. The New York Fed's Nowcast also used ISM, but the FRBNY product was paused in September 2021 due to pandemic-driven instability and was relaunched in 2024 in a redesigned form (alongside their Multivariate Core Trend) with a less consistent publication cadence. Treat GDPNow as the present-tense reference; treat the FRBNY Nowcast as a supplementary check when published. The well-known mapping from PMI to GDP comes out of Koenig (2002), a Federal Reserve Bank of Dallas paper that ran the regression that ISM still cites for its 42.3 threshold. The rough rule that practitioners carry around — every 1pt of PMI ≈ ~0.3% of annualized real GDP growth, around the trend — comes out of similar regressions; the actual coefficient is regime-dependent and worth re-fitting every few years rather than memorizing.

**Recession dating.** The NBER doesn't use PMI in its formal dating procedure. But the Conference Board includes Manufacturing New Orders in the Leading Economic Index, and the cleanest academic version of the recession-detection rule (see Banerjee & Marcellino, and Koenig 2002 for the underlying regression) is the six-month moving average of Manufacturing PMI crossing below 50 — that crossing has preceded every post-1948 US recession with a 2–10 month lead. False positives are real (1966, 1995, 2012, 2015–16, 2022 all dipped below 50 without a recession), so PMI is a *necessary but not sufficient* recession signal — useful for raising probabilities, dangerous as a single-shot rule. The general-public version of this rule (PMI < 45 sustained, in §4a) is a journalist-grade simplification of the academic test, not a substitute for it.

**The manufacturing-services divergence problem.** US manufacturing is roughly 10% of GDP (BEA value-added basis). Manufacturing PMI dominated economic conversation for decades because Services PMI didn't exist until 1997. Today, this is a measurable bias: Manufacturing PMI systematically over-weights goods cycles and under-weights services cycles, which is a problem because services dominate both employment and consumer spending. Three responses:

- For a *GDP-tracking composite*, weight Services ~70–75% / Manufacturing ~25–30% to reflect their value-added shares. ISM occasionally references composite figures inside the Services release, but there is no recurring named "ISM Composite PMI" — for a clean monthly composite, either build it yourself from the two headlines or use the S&P Global US Composite PMI, which is a recurring named series with consistent methodology.
- For *turning-point detection*, Manufacturing leads Services by 3–6 months at peaks and 1–3 months at troughs. The order of operations for a recession call: Manufacturing rolls over first, Services follows, employment confirms, then NBER eventually dates it.
- For *international comparability*, S&P Global publishes manufacturing and services PMIs for 40+ countries with consistent methodology (the JPMorgan Global Manufacturing PMI is the most-watched aggregate). ISM is US-only; for cross-country regime comparisons, S&P Global is the cleaner dataset.

**Capex and hiring decisions.** The Employment subindex of Manufacturing PMI leads BLS payrolls (manufacturing series) by ~1 month with a correlation of roughly 0.6. The Services Employment subindex is noisier but informative for the much larger services payroll. Corporate strategy teams use ISM Employment as a leading indicator of labor-market tightness for hiring-plan adjustments, and ISM Capital Expenditures (published only in the semi-annual ISM Forecast, not the monthly ROB) is a reasonable proxy for non-residential capex intentions.

**Panel size and what PMI is actually for.** ~400 firms is small. The BLS Current Employment Statistics survey, by comparison, covers ~145,000 establishments. PMI's value is *not* statistical precision — its standard errors are large enough that single-month moves of 1–2 points carry little information. PMI's value is *speed and breadth*: it covers every major sector, it lands on the first business day of the month covering the prior month, and the same panel members answer the same ~10 questions every month, so the relative comparisons are clean even when the absolute precision is loose. The right framing is that PMI is a low-resolution but high-frequency complement to high-resolution but slow indicators — read it *alongside* industrial production, retail sales, and BLS payrolls, never *instead of* them.

**Limitations to flag in any analytical use:**

- **Diffusion math discards magnitude.** A small uptick at every firm scores the same as a large uptick at half the firms. PMI is a breadth index, not a magnitude index — pair it with hard data (industrial production, retail sales) for magnitude.
- **Panel selection bias.** ISM stratifies its panel by industry contribution to GDP, but firms self-select into responding. Persistent non-responders may be over-weighted by firms with stronger administrative capacity, which correlates with size and stability.
- **Annual seasonal-adjustment refresh.** The whole history shifts every January when new SA factors are estimated. Backtests need to be re-run on the latest vintage.
- **Survey, not census.** PMI tells you what panel members *say* is happening, not what is happening. Most of the time these are the same thing; in stress regimes (early 2020, late 2008) they can diverge.

**A worked example: updating a recession probability.** A reasonable Bayesian update on receiving a PMI release: start with your prior recession-within-12-months probability (say 25% in a normal expansion), then update based on the print. Manufacturing PMI < 45 sustained for three months historically pushes the conditional probability to 60–70%. A Services PMI < 48.6 simultaneously reaching that range is the strongest signal in the modern dataset. Couple either with an inverted 10y-2y curve and you're at recession-base-case territory.

---

## 5. Common misreads across audiences

Six mistakes that show up at every level, from cable-news anchors to sell-side rate strategists:

1. **"Manufacturing in expansion!" / "Manufacturing in contraction!"** — the most common press misread. A 50.2 → 49.8 sequence is statistically indistinguishable from noise but will be reported as a regime flip. A reader who only sees "headline crossed 50" coverage will infer binary regime changes that don't exist in the data. Look at the 3-month moving average and the breadth count before treating any 50-line cross as meaningful.
2. **"PMI is still above 50, so the economy is fine."** True for the surveyed sector, deeply misleading at the level of the whole economy. Use the 42.3 / 48.6 anchors when you mean "is the economy contracting" — they're the right thresholds for that question.
3. **Over-weighting a single subindex.** A Prices spike in isolation is a commodity event. A New Orders dip in isolation is one big-customer slowdown. The signal is in the *cluster* of subindices that move together.
4. **Ignoring the prior-month revision.** Every release re-prints the prior month with revised seasonals. A "beat" relative to a stale consensus may not be a beat against the revised history.
5. **Treating Markit / S&P Global PMI and ISM PMI as interchangeable.** They aren't. Different panels, different question framing, different history. The two surveys diverged by several points for stretches of 2022–2023, with the gap widening further into 2023 (S&P Global was running multiple points lower than ISM in some months). Use whichever one your audience is calibrated to and don't mix them.
6. **Confusing "Non-Manufacturing" with "Services" in the literature.** ISM renamed the survey from "Non-Manufacturing" to "Services" with the August 2020 release. Pre-2020 references to NMI and post-2020 references to Services PMI are the same series; pre-2020 papers may have terminology that no longer matches current ISM publications.

---

## 6. Glossary

- **Diffusion index.** An index built from "better/same/worse" responses, normalized so 50 = no net change. PMI is a diffusion index.
- **Headline.** The single composite number released first — Manufacturing PMI or Services PMI.
- **Subindex.** The component questions (New Orders, Prices, Employment, etc.). Each is its own diffusion index on the 0–100 scale.
- **Breadth.** Informal: how many of the ten subindices are above 50 in a given month. Higher breadth = more resilient print.
- **ROB.** Report on Business — ISM's name for the full monthly release.
- **NMI.** Non-Manufacturing Index. The pre-August-2020 name for what is now called the Services PMI.
- **NAPM.** National Association of Purchasing Management — ISM's name from 1968 to 2002. The acronym survives in older FRED series IDs (e.g. `NAPM`), but those series were removed from FRED in June 2016 at ISM's request and no longer return data; legacy code referencing them will fail.
- **Surprise.** The gap between the printed value and the consensus forecast, usually scaled by the historical standard deviation. The basis on which markets price the release.
- **Prices Paid.** The Manufacturing subindex tracking input-cost pressure. Often referred to interchangeably as "Prices."
- **Supplier Deliveries inversion.** The fact that *rising* SD = *slowing* deliveries. The index is constructed so faster deliveries score below 50.
- **Seasonal adjustment.** Statistical procedure that removes recurring monthly patterns. ISM re-estimates SA factors every January, revising the entire history.
- **Panel.** The set of firms ISM polls each month. Stratified by industry contribution to GDP. ~400 manufacturing firms and a comparable services panel.

---

## 7. Sources and further reading

### Primary sources

- **ISM Report on Business**, monthly releases — `ismworld.org/supply-management-news-and-reports/reports/ism-pmi-reports/`
- **ISM methodology overview**, including the 42.3 / 48.6 anchor thresholds — `ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/`
- **St. Louis Fed announcement, June 2016**: ISM data removed from FRED — `news.research.stlouisfed.org/2016/06/institute-for-supply-management-data-to-be-removed-from-fred/` (relevant context for any older code or paper referencing `NAPM` on FRED)
- **FRED-MD** (McCracken & Ng) — `stlouisfed.org/research/economists/mccracken/fred-databases` — redistributable monthly macro database, 1959+
- **OECD Business Tendency Survey, US Manufacturing**, on FRED — `fred.stlouisfed.org/series/BSCICP02USM460S` — *related to but not the same as* ISM PMI
- **BEA GDP by industry** — for manufacturing and services as % of GDP — `bea.gov/data/gdp/gdp-industry`

### Foundational academic and Fed research

- Koenig, E. F. (2002). *Using the Purchasing Managers' Index to assess the economy's strength and the likely direction of monetary policy.* Federal Reserve Bank of Dallas, Economic and Financial Policy Review, vol. 1(6). The regression behind ISM's 42.3 threshold and the canonical PMI–GDP mapping.
- Banerjee, A. & Marcellino, M. (2006). *Are there any reliable leading indicators for US inflation and GDP growth?* International Journal of Forecasting. Independent assessment of PMI's predictive content for GDP.

### Market practitioner sources

- S&P Global Market Intelligence: *Examining the relationship between PMI data and changes in GDP* — quarterly note comparing PMI-implied GDP to actual.
- BIS Quarterly Review (Sept 2019): *Financial conditions and purchasing managers' indices* — link between PMIs and global financial conditions.
- JPMorgan Global Manufacturing PMI / Global Services PMI — the international counterparts to ISM, published in partnership with S&P Global.

### Adjacent data sources for triangulation

- S&P Global US Manufacturing PMI (parallel survey, different panel)
- Caixin China Manufacturing PMI (released the night before ISM)
- HCOB Eurozone Manufacturing PMI (released same morning, earlier)
- Conference Board Leading Economic Index — incorporates Manufacturing New Orders
- Atlanta Fed GDPNow (active, present-tense reference) and FRBNY Nowcast (relaunched 2024 with less consistent cadence) — both have ingested ISM as an input; see §4d for current status.
