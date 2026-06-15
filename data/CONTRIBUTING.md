# Contributing to Bellwether's data layer

Bellwether's accuracy claims are only as good as this checklist. Read it before opening a PR that touches anything under `data/` or `src/lib/content/`.

## Refreshing the Wayback PMI archive (2014-09 → present)

Each row in `data/pmi-wayback.json` cites a primary ISM Manufacturing Report on Business page captured by the Internet Archive. The script (`npm run import-wayback`) does the heavy lifting:

```
npm run import-wayback                      # fills 2014-09 → ~2 months ago
npm run import-wayback 2024-01 2024-12      # explicit range
```

For each calendar month it:
1. CDX-queries Wayback for snapshots in the release window (the 30-45 days after ISM publishes the report — the first business day of the following month).
2. Tries the modern URL pattern `ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/pmi/{month}/` first; falls back to the legacy `ism.ws/ISMReport/MfgROB.cfm` rotating page (pre-2018 era).
3. Walks snapshots in chronological order, taking the earliest one whose `<title>` contains both the expected month name and year. This guards against the legacy rotating page still showing the *previous* month's content on its earliest captures of the release window.
4. Extracts the value with `/PMI[^.]{0,300}?registered\s+(?:an\s+)?([0-9]{1,3}(?:\.[0-9])?)\s*percent/i` — handles both the common one-decimal form ("60.7 percent") and ISM's occasional whole-number form ("59 percent").
5. Records `sourceUrl = https://web.archive.org/web/{timestamp}/{ism_url}` — a stable, primary-source citation that doesn't decay even if ISM later restructures or pulls the live page.

Wayback's CDX API rate-limits hard. The script paces at 1.5s between requests with retry-on-503. A full backfill takes ~10 minutes. Re-runs are append-only — already-collected months are skipped, so it's safe to re-run with a wider range.

**Failure modes the script reports rather than swallows:**
- Zero captures in the release window (sparsely-archived months).
- Captures present but no title match (rotating page hadn't rolled over yet).
- Captures match but the regex doesn't extract — usually means ISM changed the press-release boilerplate; inspect the snapshot manually.

When a month fails, fix it by hand: find a snapshot at https://web.archive.org/web/*/ismworld.org/...pmi/{month}/, transcribe the value, and add a row to `data/pmi-curated.csv` with the Wayback URL. Hand rows in `pmi-curated.csv` win over Wayback rows in the merge.

## Refreshing the Wayback Services NMI archive (2014-09 → present)

The Services / NMI pipeline mirrors the Manufacturing one above, with three differences:

1. URL pattern targets the `/services/` slug instead of `/pmi/`, and the legacy rotating page is `NonMfgROB.cfm` instead of `MfgROB.cfm`.
2. Headline regex matches either "Services PMI registered N percent" or "NMI registered N percent" (terminology diverged across ISM's August 2020 rename).
3. Series only began in 1997, so there's no parallel of the Manufacturing 1948→2014 historical mirror — the data stack is just Wayback + curated.

```
npm run import-wayback-nmi                      # 2014-09 → ~2 months ago
npm run import-wayback-nmi 2014-09 2014-12      # explicit range
```

Output: `data/nmi-wayback.json`. Subsequent runs are append-only (existing rows are skipped). The script ignores rows whose `provenance` is still `"synthetic"` (the file ships as placeholders before the first real run), so the first scrape overwrites the placeholder data entirely.

For the four headline subindices (Business Activity, New Orders, Employment, Supplier Deliveries):

```
npm run import-wayback-nmi-subindices         # all months in nmi-wayback.json
npm run import-wayback-nmi-subindices 2024    # filter by year
```

Output: `data/nmi-subindices-wayback.json`. The script reads `nmi-wayback.json` for the canonical list of (date, sourceUrl) pairs and re-fetches each Wayback snapshot to extract the four subindex paragraphs. Refuses to operate on synthetic input — run the headline scraper first.

The CDX phase-1 cache lives at `data/.wayback-nmi-cdx-cache.json` (24h TTL), parallel to the Manufacturing cache. Commit it alongside data changes — it saves future runs ~65 seconds of rate-limited CDX queries.

**Failure modes to expect:** roughly the same as Manufacturing (sparse-archive months, unmatched titles, regex misses). One known regex limitation: when ISM phrases the Employment paragraph as "Employment activity in the services sector ... index registering N percent" instead of the standard "Employment Index ... registered N percent", the subindex regex misses. Hand-curate the missing month directly in `data/nmi-subindices-wayback.json` (May 2023 was one such case; see git history for the row format) — there's no equivalent of `pmi-curated.csv` for NMI subindices yet.

## Refreshing the historical PMI mirror (1948 → 2014)

The bulk historical series in `data/pmi-historical.json` is mirrored from the Financial Forecast Center page at <https://www.forecasts.org/data/data/NAPM.htm>. That page has been frozen at August 2014 since ISM's June 2016 licensing change, so this is generally a one-shot import — but if the page ever updates or its structure changes, run:

```
npm run import-historical
```

The script fetches the page, regex-extracts the embedded JS array, validates monotonic month-start dates and the 0–100 value range, and spot-checks any overlapping months against `pmi-curated.json` (must be within ±0.5; ISM seasonal-adjustment vintage drift is normally < 0.3). If the spot-check fails the script aborts without writing — investigate before forcing it.

The legal posture is documented in [LICENSING.md](LICENSING.md): the values are facts (Feist), reproduced with attribution to ISM as primary origin and forecasts.org as proximate mirror.

## Curating ISM PMI values (monthly)

FRED no longer carries the ISM Manufacturing PMI (removed June 2016 — see [LICENSING.md](LICENSING.md)). Two paths populate `data/pmi-curated.json` and `data/nmi-curated.json` with real headline values:

### Automatic — PRNewswire press releases (preferred)

ISM publishes every monthly Report on Business to <https://www.prnewswire.com/news/institute-for-supply-management/> on release day. The press-release URL slug encodes the value and the month (e.g. `manufacturing-pmi-at-52-7-april-2026-...`), and the page `<title>` carries the canonical "Manufacturing PMI® at 52.7%; April 2026 ..." formatting that the scraper verifies against the slug.

```
npm run import-prnewswire                      # backfills latest ~18 releases (9 Mfg + 9 Services)
npm run import-prnewswire -- --no-verify       # skip the per-release title check (faster)
```

The scraper:
1. Fetches the ISM listing page on PRNewswire.
2. Parses each release URL into `{ kind, date, value }` — slugs are deterministic and the integer-or-`N-N` decimal is parsed into a float.
3. Fetches each release page, extracts the value from `<title>`, drops any row whose title-value disagrees with the slug.
4. Merges verified rows into `data/pmi-curated.json` and `data/nmi-curated.json` (dedupes by date; new rows win on overlap).
5. Stamps `lastVerifiedAt` to today.

The press-release path covers only headline values, not subindex breakdowns or industry-level growth lists — those still require the Wayback path above. CSV manual entry remains supported for any month the scraper can't recover.

### Manual — CSV (fallback)

1. Open ISM's news feed: <https://www.ismworld.org/supply-management-news-and-reports/news-publications/news-feed/> and find the latest monthly Manufacturing Report on Business release.
2. Copy the headline PMI® value from the first paragraph of the release.
3. Append a row to `data/pmi-curated.csv` (create the file on first run):
   ```
   2026-04-01,49.1,https://www.ismworld.org/.../april-2026/
   ```
   Lines starting with `#` and blank lines are ignored.
4. Run `npm run import-pmi`. The script validates each row, sorts by date, deduplicates, and writes `data/pmi-curated.json` with an updated `lastVerifiedAt`.
5. Commit both `data/pmi-curated.csv` and `data/pmi-curated.json`. The homepage's PMI snapshot panel renders automatically once the file has at least one observation.

Schema enforces `provenance: "hand-curated"` and a per-observation `sourceUrl` — no value ships without a citation, regardless of which path produced the row. Subindices are not curated this way (their per-month values aren't always quoted in ISM news releases) and remain gated on ISM redistribution licensing.

## Refreshing FRED series (monthly)

1. `FRED_API_KEY=... npm run refresh-data` — pulls real values into `data/fred/*.json`. The script stamps `provenance: "fred"` and `lastVerifiedAt: <today>` automatically.
2. Read ISM's news release for the latest month at <https://www.ismworld.org/supply-management-news-and-reports/news-publications/news-feed/>. Copy the headline PMI number into `data/ism-spot-checks.json` as a new entry: `{ date, headlinePmi, sourceUrl, addedAt }`.
3. `npm run check-data` — runs strict freshness, ISM reconciliation, and NBER citation verification. Must pass before commit.
4. Commit. The diff for `data/fred/*.json` will be large; that's expected.

## Adding a policy event

Every policy in `src/lib/content/_policies-data.ts` must satisfy `policyFrontmatterSchema`. Specifically:

- `verifiedAt: "YYYY-MM-DD"` — the date you verified every claim in this entry against its primary source.
- `sources: [...]` — at least 2 entries, at least one with `kind: "primary"`. A primary source is a government release, the policy text itself, the original academic paper, or an authoritative archive (Federal Reserve History, NBER, UCSB Presidency Project, etc.). Secondary sources are summaries or commentary.
- `interpretations: [...]` — 2-3 readings from different `economicSchool` values. Use the economist's actual published view; if you're paraphrasing, the `summary` should still be defensible from their work.
- `ismComments: [...]` — quoted from an ISM monthly Report on Business. If a `sourceUrl` is available (post-1995 reports), include it.

When in doubt, skip the policy rather than ship an unverified one.

## Adding or updating a sector cell

Cells in `data/sectors.json` are currently all `provenance: "hand-estimate"` (see [LICENSING.md](LICENSING.md)). When ISM redistribution rights are secured, replace cells one at a time:

1. Set `provenance: "ism-licensed"` and add `sourceUrl` pointing at the ISM industry report you sourced from.
2. Bump the file's `lastVerifiedAt`.
3. The heatmap UI automatically drops the "Estimate" badge on licensed cells.

If you can't license but find a third-party study, set `provenance: "third-party"` and cite it.

## Adding an NBER recession period

The committee announces new dates on <https://www.nber.org/research/data/us-business-cycle-expansions-and-contractions> with a press release. Add the period to `data/fred/USREC.json` with the announcement URL as `sourceUrl`. `verify-nber.ts` will check the URL is reachable.

## Why this matters

Synthetic dev data has a `provenance: "synthetic"` marker. Strict CI (`STRICT_DATA_CHECKS=1`) refuses to ship it. Hand-curated content without a primary source will fail schema validation at load time. The point is that every number a user sees can be traced back to a citation in one click.
