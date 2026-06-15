import type { MonthlySeries, MonthlyObservation } from "@/lib/data/schemas";

/**
 * Subindex weights, keyed by the same names that appear in the corresponding
 * `subindices` map. Generic over reports — Manufacturing has five keys, Services
 * has four. The values are unnormalized weights; `computeBlend` normalizes them
 * internally.
 */
export type Weights = Record<string, number>;

export interface Preset {
  id: string;
  label: string;
  weights: Weights;
}

/**
 * Compute a custom-weighted blend at each month from the provided subindex
 * series. Names are inferred from the keys of the `subindices` map, so this
 * works for any report (Manufacturing 5-component, Services 4-component, etc.)
 * without changes.
 *
 * Weights are normalized so they sum to 1; if all weights are zero we fall
 * back to equal weighting across all subindices. Months that are missing from
 * any subindex are excluded.
 */
export function computeBlend(
  subindices: Record<string, MonthlySeries>,
  weights: Weights,
): MonthlyObservation[] {
  const names = Object.keys(subindices);
  if (names.length === 0) return [];

  const total = names.reduce((a, n) => a + (weights[n] ?? 0), 0);
  const equal = 1 / names.length;
  const normalized: Weights =
    total > 0
      ? Object.fromEntries(names.map((n) => [n, (weights[n] ?? 0) / total]))
      : Object.fromEntries(names.map((n) => [n, equal]));

  // Index each series by date for O(1) lookup.
  const byDate: Record<string, Map<string, number>> = {};
  for (const name of names) {
    byDate[name] = new Map();
    for (const o of subindices[name]!.observations) byDate[name]!.set(o.date, o.value);
  }

  const dates = Array.from(byDate[names[0]!]!.keys()).sort();
  const result: MonthlyObservation[] = [];
  for (const date of dates) {
    let value = 0;
    let allPresent = true;
    for (const name of names) {
      const v = byDate[name]!.get(date);
      if (v === undefined) {
        allPresent = false;
        break;
      }
      value += v * (normalized[name] ?? 0);
    }
    if (allPresent) result.push({ date, value });
  }
  return result;
}

/**
 * Educational presets for Manufacturing — each one is a hypothesis about which
 * subindex matters most.
 */
export const decomposePresets: readonly Preset[] = [
  {
    id: "ism-default",
    label: "ISM default",
    weights: {
      newOrders: 0.2,
      production: 0.2,
      employment: 0.2,
      supplierDeliveries: 0.2,
      inventories: 0.2,
    },
  },
  {
    id: "new-orders-only",
    label: "New Orders only",
    weights: {
      newOrders: 1,
      production: 0,
      employment: 0,
      supplierDeliveries: 0,
      inventories: 0,
    },
  },
  {
    id: "volume-blend",
    label: "Volume blend",
    weights: {
      newOrders: 0.4,
      production: 0.4,
      employment: 0.1,
      supplierDeliveries: 0.05,
      inventories: 0.05,
    },
  },
  {
    id: "capacity-blend",
    label: "Capacity blend",
    weights: {
      newOrders: 0.15,
      production: 0.15,
      employment: 0.15,
      supplierDeliveries: 0.45,
      inventories: 0.1,
    },
  },
];

/**
 * Educational presets for Services. Different hypotheses than Manufacturing
 * because the headline composite has four components (Business Activity,
 * New Orders, Employment, Supplier Deliveries) — no Inventories or Production.
 */
export const servicesDecomposePresets: readonly Preset[] = [
  {
    id: "ism-default",
    label: "ISM default",
    weights: {
      businessActivity: 0.25,
      newOrders: 0.25,
      employment: 0.25,
      supplierDeliveries: 0.25,
    },
  },
  {
    id: "business-activity-only",
    label: "Business Activity only",
    weights: {
      businessActivity: 1,
      newOrders: 0,
      employment: 0,
      supplierDeliveries: 0,
    },
  },
  {
    id: "demand-blend",
    label: "Demand blend",
    weights: {
      businessActivity: 0.4,
      newOrders: 0.4,
      employment: 0.15,
      supplierDeliveries: 0.05,
    },
  },
  {
    id: "labor-blend",
    label: "Labor blend",
    weights: {
      businessActivity: 0.15,
      newOrders: 0.15,
      employment: 0.6,
      supplierDeliveries: 0.1,
    },
  },
];
