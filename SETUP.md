# Bellwether — first run

## What's here

A working Next.js 16 App Router scaffold for the Bellwether project, with all four modes from the roadmap stubbed in and the spine of Phase 1 actually wired up.

```
src/app/
  page.tsx                    — Timeline (default mode, fully interactive)
  decompose/page.tsx          — Decompose (sliders + chart + recession backtest)
  fed-chair/page.tsx          — Scenario index
  fed-chair/[id]/page.tsx     — Per-scenario runner (Volcker '79, Greenspan '98, Bernanke '08, Powell '18, Powell '22)
  heatmap/page.tsx            — 18-industry × 5-regime sector heatmap
  about/page.tsx              — Editorial method
  style-guide/page.tsx        — Design tokens + primitives
  not-found.tsx
```

All routes render. The Timeline + Decompose + Fed Chair flows are interactive end-to-end. The Heatmap reads its data from `data/sectors.json` (hand-coded seed) and supports cell click → narrative.

## Install + run

```bash
cd bellwether
npm install
npm run dev          # http://localhost:3000
```

The repo ships with real FRED snapshots in `data/fred/*.json` and Wayback-scraped ISM data in `data/pmi-*.json` / `data/nmi-*.json`. To pull fresher FRED data:

```bash
echo "FRED_API_KEY=your_key" > .env.local
npm run refresh-data
```

Get a FRED key for free at <https://fred.stlouisfed.org/docs/api/api_key.html>. ISM Wayback and forecasts.org imports are documented in [data/CONTRIBUTING.md](data/CONTRIBUTING.md). The `scripts/generate-synthetic-data.mjs` fallback exists for keyless dev environments but isn't used at build time.

## Verify

```bash
npm run typecheck    # tsc --noEmit, strict mode
npm run lint         # next lint
npm run test         # vitest — 11 tests covering data integrity + blend math + backtest
```

## Where each WBS task landed

| WBS | What got built |
|---|---|
| P0.E1 (Repo & tooling) | `package.json`, `tsconfig.json` (strict + `noUncheckedIndexedAccess`), Tailwind + Prettier + ESLint |
| P0.E2 (Design system) | Tokens in `tailwind.config.ts`, primitives in `src/components/ui/*`, `/style-guide` route |
| P0.E3 (Data pipeline) | Zod schemas in `src/lib/data/schemas.ts`, typed loaders in `src/lib/data/series.ts`, `scripts/generate-synthetic-data.mjs` + `scripts/fetch-fred.ts`, contract test in `series.test.ts` |
| P0.E4 (Content schema) | `src/lib/content/policy-schema.ts`, loader in `load-policies.ts`, 9 seed policies in `_policies-data.ts` (Bretton Woods, oil shock, Volcker, NAFTA, COVID, TCJA, China tariffs, post-COVID inflation, CHIPS) |
| P1.E1 (Timeline core) | `src/components/timeline/pmi-timeline.tsx` — D3 + custom SVG, NBER bands, 50-line, hover tooltip |
| P1.E2 (Policy lane) | `src/components/timeline/policy-lane.tsx` — color-coded markers, collision-stacked, keyboard-accessible |
| P1.E3 (Interpretation cards) | `policy-card.tsx` Sheet drawer, ?policy=slug URL state, focus trap via Radix |
| P1.E4 (Layout & routing) | `site-header.tsx`, `site-footer.tsx`, hero on `/` |
| P2.E1+E2 (Decompose) | `src/lib/decompose/blend.ts`, `backtest.ts`, `decompose-mode.tsx`, `/decompose` route. Sliders auto-normalize, presets, recession backtest with hit-rate vs. ISM default |
| P3.E1 (Fed Chair engine) | `src/lib/fed-chair/scenarios.ts` (5 authored scenarios), `store.ts` (Zustand + persist), `scenario-runner.tsx` with era-locked PMITimeline (`maxDate` prop) |
| P3.E2 (Scenario authoring) | All 5 scenarios authored end-to-end with metrics, dossier, choices, actual outcome, 3 economist takes each |
| P4.E1+E2 (Heatmap) | `data/sectors.json` (18×5 = 90 cells with narratives), `sector-heatmap.tsx`, `/heatmap` route |

Phase 5 (polish & launch) is intentionally untouched — that's a deliberate handoff after content fill.

## What still needs editorial work

- 9 policy events seeded; the WBS calls for 20 in Phase 1 and 40+ at launch
- Sector cells are hand-coded estimates — refine against real ISM monthly reports once you have redistribution clarity
- ISM monthly comments only attached to a few events
- Open Graph image generator not built yet (P5.E3.T1)

## What's notably better than the roadmap allowed for

- Fed Chair has **all 5** scenarios authored, not just 1 (P3.E2 was 5 separate tasks)
- Timeline uses a **custom SVG** approach with shared D3 scales between PMI spine and policy lane via a `TimelineContext` — cleaner than the spike route P1.E1.T1 anticipated
- The synthetic data generator gives a usable dev experience with realistic recession dips before the user has a FRED key

## UX Pilot mocks

All four mode mocks were generated in your UX Pilot workspace under **File 5**:
1. Bellwether — Landing & Timeline
2. Decompose — sliders, chart, variance strip, monthly data table
3. Fed Chair — Volcker '79 dossier, era-locked chart, 6 rate buttons, scenario stepper
4. Heatmap — 18 industries × 5 regimes, color-coded cells, top-volatile bar chart

You can iterate on these in UX Pilot directly — the project's Tailwind tokens and design language are designed to absorb visual updates from those mocks easily.
