import { describe, expect, it } from "vitest";
import { computeBlend } from "./blend";
import { recessionBacktest } from "./backtest";
import { getAllSubindices, getRecessions } from "@/lib/data/series";
import { ismDefaultWeights } from "@/lib/data/schemas";

describe("computeBlend", () => {
  it("ISM-default weights reproduce a smooth series", () => {
    const subindices = getAllSubindices();
    const blend = computeBlend(subindices, ismDefaultWeights);
    expect(blend.length).toBe(subindices.newOrders.observations.length);
    expect(blend[0]!.value).toBeGreaterThan(20);
    expect(blend[0]!.value).toBeLessThan(80);
  });

  it("All-zero weights fall back to equal weighting", () => {
    const subindices = getAllSubindices();
    const zero = computeBlend(subindices, {
      newOrders: 0,
      production: 0,
      employment: 0,
      supplierDeliveries: 0,
      inventories: 0,
    });
    const equal = computeBlend(subindices, ismDefaultWeights);
    expect(zero[0]!.value).toBeCloseTo(equal[0]!.value, 4);
  });

  it("Single-index weight 1.0 matches that subindex", () => {
    const subindices = getAllSubindices();
    const blend = computeBlend(subindices, {
      newOrders: 1,
      production: 0,
      employment: 0,
      supplierDeliveries: 0,
      inventories: 0,
    });
    for (let i = 0; i < blend.length; i += 1) {
      expect(blend[i]!.value).toBeCloseTo(subindices.newOrders.observations[i]!.value, 4);
    }
  });
});

describe("recessionBacktest", () => {
  it("Reports a hit rate between 0 and 1", () => {
    const subindices = getAllSubindices();
    const recessions = getRecessions();
    const blend = computeBlend(subindices, ismDefaultWeights);
    const result = recessionBacktest(blend, recessions.periods);
    expect(result.hitRate).toBeGreaterThanOrEqual(0);
    expect(result.hitRate).toBeLessThanOrEqual(1);
    expect(result.hits).toBeLessThanOrEqual(result.recessions);
  });
});
