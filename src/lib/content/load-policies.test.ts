import { describe, expect, it } from "vitest";
import { loadPolicies } from "./load-policies";

describe("loadPolicies", () => {
  it("returns at least 5 policies", () => {
    expect(loadPolicies().length).toBeGreaterThanOrEqual(5);
  });

  it("every policy has at least 2 interpretations from different schools", () => {
    for (const p of loadPolicies()) {
      expect(p.interpretations.length).toBeGreaterThanOrEqual(2);
      const schools = new Set(p.interpretations.map((i) => i.school));
      expect(schools.size).toBeGreaterThanOrEqual(2);
    }
  });

  it("every policy has at least 3 sources", () => {
    for (const p of loadPolicies()) {
      expect(p.sources.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("policies are sorted by start date", () => {
    const ps = loadPolicies();
    for (let i = 1; i < ps.length; i += 1) {
      expect(ps[i]!.startDate >= ps[i - 1]!.startDate).toBe(true);
    }
  });
});
