# Data

This directory contains the data Bellwether ships with — checked-in JSON snapshots so the build does not require network calls at runtime.

## FRED snapshots — `fred/`

Pulled via `npm run refresh-data` (requires `FRED_API_KEY`). The legacy NAPM* files are vestigial — FRED removed all 22 ISM series in June 2016 (see [LICENSING.md](LICENSING.md)) and they ship as inert synthetic stubs.

| File | Series |
|------|--------|
| `fred/INDPRO.json` | Industrial Production: Total Index (the timeline spine) |
| `fred/IPMAN.json` | Industrial Production: Manufacturing |
| `fred/FEDFUNDS.json` | Effective Federal Funds Rate |
| `fred/USREC.json` | NBER recession indicator |
| `fred/NAPM.json`, `fred/NAPM*I.json` | Legacy ISM stubs — retained for type compatibility, not user-facing |

## ISM Manufacturing — Wayback + historical mirror

The Manufacturing PMI history is reconstructed from three sources, in priority order:

| File | Coverage | Source |
|------|----------|--------|
| `pmi-curated.json` (and `pmi-curated.csv`) | Sparse hand-transcribed rows | ISM news releases (live) |
| `pmi-wayback.json` | 2014-09 → present (with a 2015-04 → 2020-05 structural gap) | Wayback Machine snapshots of ISM monthly ROB pages |
| `pmi-historical.json` | 1948-01 → 2014-08 | forecasts.org NAPM mirror |
| `pmi-subindices-wayback.json` | New Orders / Production / Employment / Supplier Deliveries / Inventories, 2014→present | Wayback ROB pages |
| `industry-monthly-wayback.json` | Per-month industry growth/contraction lists | Wayback ROB pages |

## ISM Services / NMI — Wayback only

Services started in 1997 and has no third-party historical mirror, so the stack is just Wayback + curated.

| File | Coverage | Source |
|------|----------|--------|
| `nmi-curated.json` | Sparse hand-transcribed rows | ISM news releases |
| `nmi-wayback.json` | 2014-09 → present (with a 2015-04 → 2020-06 structural gap) | Wayback Machine snapshots of ISM monthly Services ROB pages |
| `nmi-subindices-wayback.json` | Business Activity / New Orders / Employment / Supplier Deliveries | Wayback ROB pages |
| `services-industry-monthly-wayback.json` | Per-month industry growth/contraction lists for the 18 Services industries | Wayback ROB pages |

## Sector heatmap

| File | Contents |
|------|----------|
| `sectors.json` | Manufacturing heatmap, 18 industries × 5 policy regimes (90 cells). The 18 Pandemic & Reshoring cells are computed at runtime from `industry-monthly-wayback.json`; the other 72 are editorial hand estimates. |
| `sectors-services.json` | Services heatmap, same shape. |

## Cross-checks

| File | Purpose |
|------|---------|
| `ism-spot-checks.json` | Reconciliation rows for `npm run check-data` |

## Refresh policy

- FRED — refresh as often as you like via `npm run refresh-data`. The script stamps `provenance: "fred"` and a `lastVerifiedAt` automatically.
- Wayback — append-only via the import scripts in `scripts/import-wayback-*.ts`. See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow per data layer.
- forecasts.org — generally a one-shot import (the source page froze at August 2014). Re-run via `npm run import-historical` if the page ever updates.

## Schema

All series files follow the schemas in `src/lib/data/schemas.ts`. Validation runs at load time — invalid data fails fast.
