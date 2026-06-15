import { describe, expect, it } from "vitest";
import { findGlossaryTerm, glossaryBySlug, loadGlossary } from "./load-glossary";

describe("loadGlossary", () => {
  it("returns at least 12 terms", () => {
    expect(loadGlossary().length).toBeGreaterThanOrEqual(12);
  });

  it("every term has a kebab-case slug, a non-empty term, and a definition >= 20 chars", () => {
    for (const t of loadGlossary()) {
      expect(t.slug).toMatch(/^[a-z0-9-]+$/);
      expect(t.term.length).toBeGreaterThan(0);
      expect(t.definition.length).toBeGreaterThanOrEqual(20);
    }
  });

  it("slugs are unique", () => {
    const slugs = loadGlossary().map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every related-slug reference points at an existing term", () => {
    const all = new Set(loadGlossary().map((t) => t.slug));
    for (const t of loadGlossary()) {
      for (const r of t.related) {
        expect(all.has(r), `term '${t.slug}' references unknown related slug '${r}'`).toBe(true);
      }
    }
  });

  it("findGlossaryTerm hits and misses", () => {
    expect(findGlossaryTerm("pmi")?.term).toBe("PMI");
    expect(findGlossaryTerm("does-not-exist")).toBeUndefined();
  });

  it("glossaryBySlug exposes the same data as loadGlossary", () => {
    const map = glossaryBySlug();
    expect(map.size).toBe(loadGlossary().length);
    for (const t of loadGlossary()) expect(map.get(t.slug)).toEqual(t);
  });
});
