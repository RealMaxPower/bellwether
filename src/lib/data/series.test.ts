import { describe, expect, it } from "vitest";
import { getPMI, getRecessions, getAllSubindices } from "./series";
import { subindexNames } from "./schemas";

describe("data series", () => {
  it("PMI series has continuous monthly observations", () => {
    const pmi = getPMI();
    expect(pmi.observations.length).toBeGreaterThan(900);
    // Dates strictly increasing.
    for (let i = 1; i < pmi.observations.length; i += 1) {
      expect(pmi.observations[i]!.date > pmi.observations[i - 1]!.date).toBe(true);
    }
  });

  it("All subindices have the same date alignment as PMI", () => {
    const pmi = getPMI();
    const subindices = getAllSubindices();
    const expectedLen = pmi.observations.length;
    for (const name of subindexNames) {
      expect(subindices[name].observations.length).toBe(expectedLen);
    }
  });

  it("Recession periods are sorted and bounded", () => {
    const recessions = getRecessions();
    expect(recessions.periods.length).toBeGreaterThan(0);
    for (const r of recessions.periods) {
      expect(r.peak < r.trough).toBe(true);
    }
  });

  it("PMI values are within plausible bounds", () => {
    const pmi = getPMI();
    for (const o of pmi.observations) {
      expect(o.value).toBeGreaterThan(20);
      expect(o.value).toBeLessThan(80);
    }
  });
});
