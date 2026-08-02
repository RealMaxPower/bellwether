import { describe, expect, it } from "vitest";
import { isCacheUsable, mergeRows, resolveMonth, type CdxRow } from "./cdx-index";

const row = (timestamp: string, original = "https://ismworld.org/x"): CdxRow => ({
  timestamp,
  original,
});

describe("mergeRows", () => {
  it("unions both lists and sorts chronologically", () => {
    const merged = mergeRows([row("20260101")], [row("20250101")]);
    expect(merged.map((r) => r.timestamp)).toEqual(["20250101", "20260101"]);
  });

  it("de-duplicates on timestamp + original, not timestamp alone", () => {
    // Same instant, two URL eras — both are real, distinct candidates.
    const a = row("20260101", "https://ismworld.org/ism-report-on-business/pmi/may/");
    const b = row("20260101", "https://ismworld.org/ism-pmi-reports/pmi/may/");
    expect(mergeRows([a], [b])).toHaveLength(2);
    expect(mergeRows([a], [a])).toHaveLength(1);
  });
});

describe("resolveMonth", () => {
  const prior = [row("20240101"), row("20240202")];

  it("keeps the previous index when every era failed", () => {
    const { rows, note } = resolveMonth(null, prior);
    expect(rows).toEqual(prior);
    expect(note).toContain("kept previous");
  });

  it("merges rather than replaces when the answer is partial", () => {
    // The regression that motivated this module: one era answered with 9 rows
    // while the other failed, and the 9 overwrote a 68-row index.
    const partial = { rows: [row("20260601")], complete: false };
    const { rows, note } = resolveMonth(partial, prior);
    expect(rows).toHaveLength(3);
    expect(note).toContain("partial");
  });

  it("replaces outright when every era answered", () => {
    const complete = { rows: [row("20260601")], complete: true };
    const { rows, note } = resolveMonth(complete, prior);
    expect(rows).toHaveLength(1);
    expect(note).toBe("");
  });

  it("treats a genuinely empty complete answer as authoritative", () => {
    // complete:true with no rows means Wayback really has nothing — unlike a
    // failure, that is a fact and should be recorded.
    expect(resolveMonth({ rows: [], complete: true }, prior).rows).toEqual([]);
  });
});

describe("isCacheUsable", () => {
  const base = {
    version: 2,
    expectedVersion: 2,
    ageMs: 1_000,
    ttlMs: 24 * 60 * 60 * 1000,
    legacyCount: 28,
  };

  it("accepts a fresh, current, populated cache", () => {
    expect(isCacheUsable(base)).toBe(true);
  });

  it("rejects a cache written by an older build", () => {
    expect(isCacheUsable({ ...base, version: 1 })).toBe(false);
    expect(isCacheUsable({ ...base, version: undefined })).toBe(false);
  });

  it("rejects a cache past its TTL", () => {
    expect(isCacheUsable({ ...base, ageMs: base.ttlMs + 1 })).toBe(false);
  });

  it("rejects a cache whose legacy index is hollow", () => {
    // Regression: a transient archive.org failure zeroed `legacy`, and because
    // the check lived on the *reuse* branch rather than gating the whole cached
    // branch, the run fell into the per-month refill path — which never touches
    // `legacy` — and rewrote the same empty index. It has to reach a rebuild.
    expect(isCacheUsable({ ...base, legacyCount: 0 })).toBe(false);
  });
});
