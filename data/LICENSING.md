# Data licensing tracker

Bellwether's data layer mixes freely-redistributable sources (FRED, NBER) with sources that require explicit permission (ISM industry-level data). This file tracks the licensing status so contributors can see at a glance what's safe to ship.

## Current status

| Source | What we use | License status | Action |
|---|---|---|---|
| FRED | Fed Funds rate, INDPRO, IPMAN | Public, redistribution allowed | Pull via `npm run refresh-data` |
| NBER | Business cycle dating (recession periods) | Public, citation required | Citation chain in `data/fred/USREC.json` |
| ~~FRED NAPM mirror~~ | ~~Manufacturing PMI composite via FRED~~ | **Removed June 2016** when ISM tightened licensing | See "Headline PMI backfill" below |
| forecasts.org NAPM page | Continuous monthly PMI composite, 1948-01 → 2014-08 (`data/pmi-historical.json`) | Numerical values are facts (Feist v. Rural, 499 U.S. 340); reproduced with attribution to ISM as primary origin and forecasts.org as proximate mirror. Page itself stopped updating in 2014. | Refresh via `npm run import-historical` |
| Wayback Machine archive of ISM monthly Report on Business pages | Headline PMI values, 2014-09 → present (`data/pmi-wayback.json`); per-row `sourceUrl` is a stable `web.archive.org/web/{ts}/{ism_url}` link | Each row cites a primary ISM release as captured on a specific date. Values are facts (Feist); the archive snapshot is the citation, not the redistribution channel. | Refresh via `npm run import-wayback` |
| ISM monthly news releases (live) | Sparse headline values in `data/pmi-curated.json`, hand-transcribed | Fair-use editorial quote of factual values, attributed. Currently 8 rows; the Wayback archive supersedes most of these. | Refresh via `npm run import-pmi` |
| ISM industry-level data | The 18 industries × 5 regimes scores in `data/sectors.json` | **Not licensed** | See "Sector data" below |
| ISM monthly comments | Quoted text in `_policies-data.ts` `ismComments[]` | Fair-use editorial quote, attributed | OK as quoted excerpts; do not bulk-redistribute |

## Sector data

`data/sectors.json` cells currently carry `provenance: "hand-estimate"` because we don't have ISM redistribution rights for industry-level scores. The cells are the maintainer's editorial estimates, informed by reading ISM monthly reports — not direct ISM data.

The path to upgrading these to `provenance: "ism-licensed"`:

1. **Contact ISM**: <research@ismworld.org> (their research/redistribution inquiry contact).
2. Scope the ask: redistribution of industry-level expanding/contracting indicators across the 5 regimes shown in the heatmap.
3. Ask about cost, attribution requirements, and whether attribution can live in the heatmap UI (cell tooltip + footer) rather than a click-through.
4. If granted, replace cells one at a time per the procedure in [CONTRIBUTING.md](CONTRIBUTING.md).

**Until then**: every heatmap cell shows an "Estimate" badge in the UI, and the About-the-data page says so plainly.

## Headline PMI backfill

FRED removed all 22 ISM series in June 2016 when ISM tightened redistribution licensing. FRED-MD and ALFRED dropped the same variables. The Internet Archive's Wayback Machine is the path back to primary ISM releases — each row of `data/pmi-wayback.json` cites a specific archived snapshot of ISM's monthly Report on Business page.

In the meantime we mirror the Financial Forecast Center page at <https://www.forecasts.org/data/data/NAPM.htm>, which embeds the full monthly composite from 1948-01 through 2014-08 in a Google-Charts JS array. The legal posture: the *numerical values* are facts (Feist Publications v. Rural Telephone Service, 499 U.S. 340 (1991)) and are not protected by copyright. We attribute ISM as the primary origin and forecasts.org as the proximate mirror.

For the 2014→present window we scrape the Wayback Machine's snapshots of ISM's own monthly Manufacturing Report on Business pages. Each row's `sourceUrl` is a stable `web.archive.org/web/{timestamp}/{ism_url}` link, so the citation chain is to a primary ISM release captured on a specific date. The script (`npm run import-wayback`) takes the earliest 200-status snapshot in each release window so we record the as-first-published value rather than ISM's silent later revisions.

Wayback's ISM coverage is *not* end-to-end:

- **2014-09 → 2015-03** — captured at `ism.ws/ISMReport/MfgROB.cfm` (legacy rotating page).
- **2015-04 → 2020-05** — **structural gap**. Wayback stopped capturing the legacy URL in April 2015, and ISM's redesigned `ismworld.org` site wasn't indexed by Wayback until June 2020. ~62 months are unfillable from this source.
- **2020-06 → ~2 months ago** — captured at `ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/pmi/{month}/`.
- **most recent ~2 months** — release captures often lag a few weeks behind publication.

The current import yields ~69 observations from Wayback. The 2015-04 → 2020-05 hole is filled by the existing forecasts.org mirror only through 2014-08, so that 5-year window currently shows on the homepage as a disclosed gap. To close it we would need either: paid Bloomberg/Refinitiv access; a Federal Reserve research-paper appendix that reproduced the series in that range (Harris 1991 covers up to 1990 only — too early); or a manual transcription pass from PDFs in academic libraries.

The ISM redistribution conversation (status log below) remains the path to a continuously-licensed series with subindices and industry-level data.

## Status log

| Date | Note |
|---|---|
| 2026-05-04 | Initial tracker. ISM redistribution conversation not yet opened. |
| 2026-05-06 | Imported 800-observation forecasts.org mirror covering 1948-01 → 2014-08 via `npm run import-historical`. Spot-checked against the two overlapping hand-curated points (2008-10, 2009-03); both within 0.3 of the FFC values. ISM redistribution conversation still not opened. |
