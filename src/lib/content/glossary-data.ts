import type { GlossaryTerm } from "./glossary-schema";

/**
 * Seed glossary entries. Treat this as the editorial track's working file —
 * additions here are picked up by `<GlossaryTerm slug="...">` immediately.
 *
 * Definitions match the §6 glossary in `docs/pmi-explainer.md`. When updating
 * one, update the other.
 */
export const glossaryData: readonly GlossaryTerm[] = [
  {
    slug: "pmi",
    term: "PMI",
    definition:
      "Purchasing Managers Index. ISM's monthly composite for either Manufacturing (since 1948) or Services (since 1997). Above 50 = the surveyed sector grew vs. the prior month; below 50 = it shrank.",
    related: ["diffusion-index", "headline", "subindex", "nmi"],
  },
  {
    slug: "diffusion-index",
    term: "diffusion index",
    definition:
      "An index built from \"better/same/worse\" responses, normalized so 50 = no net change. Calculation: (% Better) + ½ × (% Same). Discards magnitude — a small uptick at every firm scores the same as a large uptick at half the firms.",
    related: ["pmi", "headline"],
  },
  {
    slug: "headline",
    term: "headline",
    definition:
      "The single composite number released first — Manufacturing PMI (equally weighted average of New Orders, Production, Employment, Supplier Deliveries, Inventories) or Services PMI (equally weighted average of Business Activity, New Orders, Employment, Supplier Deliveries).",
    related: ["pmi", "subindex"],
  },
  {
    slug: "subindex",
    term: "subindex",
    definition:
      "One of the component questions (New Orders, Prices, Employment, etc.). Each is its own diffusion index on the 0–100 scale. ISM publishes ~10 subindices per release; only some feed the headline.",
    related: ["pmi", "headline", "breadth"],
  },
  {
    slug: "breadth",
    term: "breadth",
    definition:
      "Informal: how many of the ten subindices are above 50 in a given month. Higher breadth = more resilient print. A headline above 50 with breadth below 5/10 is a fragile expansion; the reverse is a resilient one.",
    related: ["headline", "subindex"],
  },
  {
    slug: "rob",
    term: "ROB",
    definition:
      "Report on Business — ISM's name for the full monthly release (Manufacturing ROB published the first business day; Services ROB the third).",
    related: ["pmi", "nmi"],
  },
  {
    slug: "nmi",
    term: "NMI",
    definition:
      "Non-Manufacturing Index. The pre-2021 name for what is now called the Services PMI. ISM renamed the survey in 2021; pre-2021 papers may still use NMI.",
    related: ["pmi", "rob"],
  },
  {
    slug: "napm",
    term: "NAPM",
    definition:
      "National Association of Purchasing Management — ISM's name from 1968 to 2002. The acronym survives in legacy series IDs (e.g. FRED's `NAPM`), but those series were removed from FRED in June 2016 at ISM's request and no longer return data.",
    related: ["pmi"],
  },
  {
    slug: "surprise",
    term: "surprise",
    definition:
      "The gap between the printed value and the consensus forecast, usually scaled by the historical standard deviation. The basis on which markets price the release. A one-sigma upside surprise (~1.5 PMI points above consensus) is a tradable event.",
    related: ["pmi"],
  },
  {
    slug: "prices-paid",
    term: "Prices Paid",
    definition:
      "The Manufacturing subindex tracking input-cost pressure. Often referred to interchangeably as \"Prices.\" Leads PPI by 1–3 months; the cleanest leading indicator of CPI direction in the ISM data.",
    related: ["subindex"],
  },
  {
    slug: "supplier-deliveries-inversion",
    term: "Supplier Deliveries inversion",
    definition:
      "A *rising* Supplier Deliveries index means deliveries are *slowing*. Pre-2020, this reliably signaled strong demand. From 2020 onward, rising SD often signals supply-side breakage instead. Now a conditional indicator — read alongside Prices to disambiguate demand-side from supply-side stress.",
    related: ["subindex"],
  },
  {
    slug: "seasonal-adjustment",
    term: "seasonal adjustment",
    definition:
      "Statistical procedure that removes recurring monthly patterns. ISM re-estimates SA factors every January, revising the entire history. The 2012 refresh extended its window from 4 to 7 years specifically because of the autumn-2008 GFC prints.",
    related: ["pmi"],
  },
  {
    slug: "panel",
    term: "panel",
    definition:
      "The set of firms ISM polls each month. Stratified by industry contribution to GDP. ~400 manufacturing firms and a comparable services panel — small relative to BLS's ~145,000-establishment CES, which is why PMI's value is speed and breadth rather than statistical precision.",
    related: ["pmi"],
  },
  {
    slug: "new-orders",
    term: "New Orders",
    definition:
      "Manufacturing PMI subindex tracking forward demand. Leads Production by ~1 month. Combined with Inventories (New Orders minus Inventories spread), leads the headline PMI itself by 3–6 months.",
    related: ["subindex", "headline"],
  },
  {
    slug: "production",
    term: "Production",
    definition:
      "Manufacturing PMI subindex tracking output. Closely tracks the Federal Reserve's Industrial Production manufacturing series with a slight lead.",
    related: ["subindex"],
  },
  {
    slug: "employment",
    term: "Employment",
    definition:
      "Manufacturing PMI subindex tracking hiring. Leads BLS payrolls (manufacturing series) by ~1 month with a correlation of roughly 0.6.",
    related: ["subindex"],
  },
  {
    slug: "supplier-deliveries",
    term: "Supplier Deliveries",
    definition:
      "Manufacturing PMI subindex tracking how fast suppliers fulfill orders. The index is constructed so faster deliveries score below 50 — see Supplier Deliveries inversion for the regime-dependent interpretation.",
    related: ["subindex", "supplier-deliveries-inversion"],
  },
  {
    slug: "inventories",
    term: "Inventories",
    definition:
      "Manufacturing PMI subindex tracking respondents' own inventory levels. Rising Inventories with falling New Orders is the classic recession signature — production has gotten ahead of demand and somebody's about to slash orders.",
    related: ["subindex"],
  },
  {
    slug: "services-pmi",
    term: "Services PMI",
    definition:
      "ISM's monthly composite for the services sector, monthly since 1997. Renamed from \"Non-Manufacturing Index\" (NMI) in 2021. Equally weighted average of four headline subindices: Business Activity, New Orders, Employment, Supplier Deliveries. Above 50 = sector grew vs. prior month; above ~48.6 = overall economy expanded.",
    related: ["pmi", "nmi", "business-activity", "headline"],
  },
  {
    slug: "business-activity",
    term: "Business Activity",
    definition:
      "Services PMI subindex tracking output, the analog of Production in the Manufacturing PMI. Often the largest mover within the Services headline; tracks roughly with retail sales and consumer-services GDP.",
    related: ["subindex", "services-pmi"],
  },
  {
    slug: "inventory-sentiment",
    term: "Inventory Sentiment",
    definition:
      "Services PMI subindex (not in the headline) asking respondents whether inventories feel \"too high\" / \"about right\" / \"too low.\" Underused. Persistent \"too high\" readings lead services-sector discounting and pricing pressure.",
    related: ["subindex", "services-pmi"],
  },
];
